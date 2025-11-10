package com.example.distribute.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class AlertService {
    @Autowired
    private JdbcTemplate jdbc;

    public List<Map<String,Object>> listAlerts(Long from, Long to) {
        // 简单示例，按时间范围查询
        String sql = "SELECT alarm_id, vehicle_id, type, severity, UNIX_TIMESTAMP(timestamp) as ts, detail FROM alarm_log";
        // TODO: 增加 WHERE
        return jdbc.queryForList(sql);
    }

    public void saveAlert(Map<String, Object> alert) {
        jdbc.update("INSERT INTO alarm_log(vehicle_id,type,severity,timestamp,detail,status) VALUES(?,?,?,FROM_UNIXTIME(?),?,?)",
                alert.get("vehicle_id"), alert.get("alert_type"), alert.get("severity"), alert.get("timestamp"), alert.get("details"), "NEW");
    }

    public void ackAlert(Long id) {
        jdbc.update("UPDATE alarm_log SET status='ACK' WHERE id=?", id);
    }
}