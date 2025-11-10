package com.example.distribute.service;

import org.apache.hadoop.hbase.TableName;
import org.apache.hadoop.hbase.client.*;
import org.apache.hadoop.hbase.util.Bytes;
import org.springframework.stereotype.Service;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;

import java.util.*;

@Service
public class VehicleService {

    private final JedisPool jedisPool;
    private final Connection hbaseConn;

    // 构造器注入 JedisPool 和 HBase Connection
    public VehicleService(JedisPool jedisPool, Connection hbaseConn) {
        this.jedisPool = jedisPool;
        this.hbaseConn = hbaseConn;
    }

    public List<Map<String, Object>> getAllCurrentStatuses() {
        try (var jedis = jedisPool.getResource()) {
            Set<String> keys = jedis.smembers("vehicle:keys");
            List<Map<String, Object>> list = new ArrayList<>();
            for (String key : keys) {
                Map<String, String> data = jedis.hgetAll(key);
                Map<String, Object> m = new HashMap<>();
                m.put("vehicleId", key.split(":")[1]);
                m.put("latitude", Double.parseDouble(data.get("lat")));
                m.put("longitude", Double.parseDouble(data.get("lon")));
                m.put("speed", Double.parseDouble(data.get("speed")));
                m.put("status", data.getOrDefault("status", "UNKNOW"));
                m.put("load", data.getOrDefault("load", "0"));
                list.add(m);
            }
            return list;
        }
    }

    public Map<String, Object> getCurrentLocation(String id) {
        try (var jedis = jedisPool.getResource()) {
            Map<String, String> d = jedis.hgetAll("vehicle:" + id);
            return Map.of(
                "vehicleId", id,
                "latitude", d.get("lat"),
                "longitude", d.get("lon"),
                "speed", d.get("speed"),
                "timestamp", d.get("timestamp")
            );
        }
    }

    public List<Map<String, Object>> getLocationHistory(String id, Long from, Long to) {
        List<Map<String, Object>> history = new ArrayList<>();
        try (var table = hbaseConn.getTable(TableName.valueOf("vehicle_tracking"))) {
            Scan scan = new Scan();
            scan.setRowPrefixFilter(Bytes.toBytes(id + "_"));
            try (var rs = table.getScanner(scan)) {
                for (var r : rs) {
                    String rk = Bytes.toString(r.getRow());
                    long ts = Long.parseLong(rk.split("_")[1]);
                    if (ts >= from && (to == null || ts <= to)) {
                        history.add(Map.of(
                            "timestamp", ts,
                            "latitude", Bytes.toString(r.getValue(Bytes.toBytes("loc"), Bytes.toBytes("lat"))),
                            "longitude", Bytes.toString(r.getValue(Bytes.toBytes("loc"), Bytes.toBytes("lon"))),
                            "speed", Bytes.toString(r.getValue(Bytes.toBytes("stat"), Bytes.toBytes("speed")))
                        ));
                    }
                }
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return history;
    }

    // 重载方法，只有from参数时调用
    public List<Map<String, Object>> getLocationHistory(String id, Long from) {
        return getLocationHistory(id, from, null);
    }
}
