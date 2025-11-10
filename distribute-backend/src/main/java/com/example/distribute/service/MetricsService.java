package com.example.distribute.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import redis.clients.jedis.JedisPool;

import java.sql.Timestamp;
import java.util.HashMap;
import java.util.Map;

@Service
public class MetricsService {
    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private JedisPool jedisPool;

    public Map<String, Object> computeOverview(Long from, Long to) {
    	Timestamp startTime = from != null ? new Timestamp(from) : null;
        Timestamp endTime = to != null ? new Timestamp(to) : new Timestamp(System.currentTimeMillis());
        int total = jdbc.queryForObject(
                "SELECT COUNT(*) FROM order_202506 WHERE start_time BETWEEN ? AND ?", Integer.class, startTime, endTime);
        int processing = jdbc.queryForObject(
                "SELECT COUNT(*) FROM order_202506 WHERE status='in_transit' AND start_time BETWEEN ? AND ?", Integer.class, startTime, endTime);
        int delayed = jdbc.queryForObject(
                "SELECT COUNT(*) FROM order_202506 WHERE status='delayed' AND start_time BETWEEN ? AND ?", Integer.class, startTime, endTime);
        double onTimeRate = total == 0 ? 0 : ((double)(total - delayed)/ total)*100;
        Map<String, Object> m = new HashMap<>();
        m.put("totalOrders", total);
        m.put("processingOrders", processing);
        m.put("delayedOrders", delayed);
        m.put("onTimeRate", String.format("%.1f", onTimeRate));
        return m;
    }

    public int countAlertsSince(Long since) {
        return jdbc.queryForObject(
                "SELECT COUNT(*) FROM alarm_log WHERE UNIX_TIMESTAMP(timestamp)>=?", Integer.class, since);
    }
}