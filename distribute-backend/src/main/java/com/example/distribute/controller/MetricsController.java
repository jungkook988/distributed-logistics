package com.example.distribute.controller;

import com.example.distribute.service.MetricsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/metrics")
public class MetricsController {
    @Autowired
    private MetricsService metricsService;

    @GetMapping("/overview")
    public Map<String, Object> getOverview(
            @RequestParam(required = false)
            @DateTimeFormat(pattern = "yyyy-MM-dd") Long from,
            @RequestParam(required = false)
            @DateTimeFormat(pattern = "yyyy-MM-dd") Long to) {
        return metricsService.computeOverview(from, to);
    }

    @GetMapping("/alerts/count")
    public Map<String, Integer> getAlertCount(@RequestParam Long since) {
        int count = metricsService.countAlertsSince(since);
        return Map.of("alertCount", count);
    }
}
