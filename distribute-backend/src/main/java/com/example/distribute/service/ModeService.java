package com.example.distribute.service;

import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class ModeService {
    private String mode = "mock";
    public Map<String,String> setMode(String m) {
        mode = m;
        return Map.of("mode", mode);
    }
    public String getMode() { return mode; }
}