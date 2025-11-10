package com.example.distribute.kafka;

import com.example.distribute.websocket.VehicleWebSocketHandler;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;

@Component
public class KafkaAlertListener {

    private final VehicleWebSocketHandler webSocketHandler;
    private final JedisPool jedisPool;
    
    public KafkaAlertListener(VehicleWebSocketHandler webSocketHandler, JedisPool jedisPool) {
    	this.webSocketHandler = webSocketHandler;
        this.jedisPool = jedisPool;
    }

    @KafkaListener(topics = "alerts", groupId = "logistics-group")
    public void onMessage(ConsumerRecord<String, String> record) {
        String alertJson = record.value();
        webSocketHandler.broadcast(alertJson);
    }

    @KafkaListener(topics = "vehicle-location", groupId = "logistics-group")
    public void onVehicleLocation(ConsumerRecord<String, String> record) {
        String locationJson = record.value();
        webSocketHandler.broadcast(locationJson);

        // 同步更新 Redis
        try (Jedis jedis = jedisPool.getResource()) {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.Map<String, Object> data = mapper.readValue(locationJson, java.util.Map.class);
            String vehicleId = (String) data.get("vehicle_id");
            jedis.hset("vehicle:" + vehicleId, new java.util.HashMap<String, String>() {{
                put("lat", data.get("latitude").toString());
                put("lon", data.get("longitude").toString());
                put("speed", data.get("speed").toString());
                put("timestamp", data.get("timestamp").toString());
            }});
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
} 

