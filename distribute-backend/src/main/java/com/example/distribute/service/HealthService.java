package com.example.distribute.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import redis.clients.jedis.JedisPool;
import org.apache.hadoop.hbase.TableName;
import org.apache.hadoop.hbase.client.Connection;
import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.AdminClientConfig;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Service
public class HealthService {
    private final JedisPool jedisPool;
    private final Connection hbaseConn;
    private final String bootstrapServers;
    @Value("${spark.master.url:http://localhost:4040}")
    private String sparkMasterUrl;

    public HealthService(JedisPool jedisPool,
                         Connection hbaseConn,
                         @Value("${spring.kafka.bootstrap-servers}") String bootstrapServers) {
        this.jedisPool = jedisPool;
        this.hbaseConn = hbaseConn;
        this.bootstrapServers = bootstrapServers;
    }

    public Map<String, String> checkAll() {
        Map<String, String> status = new HashMap<>();
        
        // 使用统一的CompletableFuture模式实现所有服务的健康检查
        CompletableFuture<Void> redisCheck = CompletableFuture.runAsync(() -> {
            try (var jedis = jedisPool.getResource()) {
                status.put("redis", jedis.ping().equals("PONG") ? "UP" : "DOWN");
            } catch (Exception e) {
                status.put("redis", "DOWN: " + e.getMessage());
            }
        });
        
        CompletableFuture<Void> hbaseCheck = CompletableFuture.runAsync(() -> {
            try (var admin = hbaseConn.getAdmin()) {
                boolean ok = admin.tableExists(TableName.valueOf("vehicle_tracking"));
                status.put("hbase", ok ? "UP" : "DOWN (table not found)");
            } catch (Exception e) {
                status.put("hbase", "DOWN: Connection refused");
            }
        });
        
        CompletableFuture<Void> kafkaCheck = CompletableFuture.runAsync(() -> {
            Map<String, Object> props = new HashMap<>();
            props.put(AdminClientConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
            try (AdminClient client = AdminClient.create(props)) {
                var controller = client.describeCluster().controller().get(5, TimeUnit.SECONDS);
                status.put("kafka", controller != null ? "UP" : "DOWN (controller not found)");
            } catch (Exception e) {
                status.put("kafka", "DOWN: " + e.getMessage());
            }
        });
        
        CompletableFuture<Void> sparkCheck = CompletableFuture.runAsync(() -> {
        	HttpURLConnection connection = null;
            try {
                String apiUrl = sparkMasterUrl + "/api/v1/applications";
                URL url = new URL(apiUrl);
                connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("GET");
                connection.setConnectTimeout(5000);
                connection.setReadTimeout(5000);
                
                int responseCode = connection.getResponseCode();
                status.put("spark", responseCode == HttpURLConnection.HTTP_OK ? "UP" : "DOWN (HTTP " + responseCode + ")");
            } catch (Exception e) {
                status.put("spark", "DOWN: " + e.getMessage());
            } finally {
                if (connection != null) {
                    connection.disconnect(); // 手动关闭连接
                }
            }
        });
        
        // 等待所有检查完成
        CompletableFuture.allOf(redisCheck, hbaseCheck, kafkaCheck, sparkCheck).join();
        
        return status;
    }
}