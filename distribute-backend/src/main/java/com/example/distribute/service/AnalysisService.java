package com.example.distribute.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;


@Service
public class AnalysisService {
    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private MetricsService metricsService;  // 复用已有的方法

    public Map<String,Object> getSummary(Long from, Long to) {
        // 直接调用 MetricsService
        return metricsService.computeOverview(from, to);
    }

    public List<Map<String,Object>> getTrends(String metric, String interval, Long from, Long to) {
        String sql = """
            SELECT FLOOR(UNIX_TIMESTAMP(timestamp) / 3600) * 3600 AS timeBucket,
                   AVG(CASE WHEN status!='delayed' THEN 1 ELSE 0 END)*100 AS value
              FROM order_202506
             WHERE timestamp BETWEEN FROM_UNIXTIME(?) AND FROM_UNIXTIME(?)
             GROUP BY timeBucket
             ORDER BY timeBucket
        """;
        return jdbc.queryForList(sql, from, to);
    }


    public List<Map<String,Object>> getRegionData(String metric, Long from, Long to) {
        // 简单按省份聚合：假设 orders 表有 province 字段
        String sql = """
            SELECT province AS region,
                   AVG(CASE WHEN status!='delayed' THEN 1 ELSE 0 END)*100 AS value
              FROM order_202506
             WHERE timestamp BETWEEN FROM_UNIXTIME(?) AND FROM_UNIXTIME(?)
             GROUP BY province
        """;
        return jdbc.queryForList(sql, from, to);
    }

    public byte[] export(String format, String type, Long from, Long to) {
        // 简单 CSV 导出
        List<Map<String,Object>> data;
        if ("summary".equals(type)) {
            data = List.of(getSummary(from, to));
        } else if ("trends".equals(type)) {
            data = getTrends(type, "hour", from, to);
        } else {
            data = getRegionData(type, from, to);
        }
        // 拼 CSV
        StringBuilder sb = new StringBuilder();
        if (!data.isEmpty()) {
            // header
            data.get(0).keySet().forEach(k -> sb.append(k).append(","));
            sb.setLength(sb.length()-1);
            sb.append("\n");
            // rows
            for (var row : data) {
                row.values().forEach(v -> sb.append(v).append(","));
                sb.setLength(sb.length()-1);
                sb.append("\n");
            }
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }
}
