package com.example.distribute.controller;

import com.example.distribute.service.HealthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/health")
public class HealthController {
    @Autowired
    private HealthService healthService;

    @GetMapping
    public Map<String, String> health() {
        return healthService.checkAll();
    }
}