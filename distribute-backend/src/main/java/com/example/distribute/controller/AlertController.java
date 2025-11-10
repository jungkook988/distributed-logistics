package com.example.distribute.controller;

import com.example.distribute.service.AlertService;
import com.example.distribute.websocket.VehicleWebSocketHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/alerts")
public class AlertController {
    @Autowired
    private AlertService alertService;

    @GetMapping
    public List<Map<String, Object>> listAlerts(
            @RequestParam(required = false) Long from,
            @RequestParam(required = false) Long to) {
        return alertService.listAlerts(from, to);
    }

    @PostMapping
    public String postAlert(@RequestBody Map<String, Object> alert) {
        alertService.saveAlert(alert);
        return "ok";
    }

    @PostMapping("/{id}/ack")
    public String ackAlert(@PathVariable Long id) {
        alertService.ackAlert(id);
        return "acknowledged";
    }
}