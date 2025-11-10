package com.example.distribute.controller;

import com.example.distribute.service.ModeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/mode")
public class ModeController {
    @Autowired
    private ModeService modeService;

    @PostMapping
    public Map<String, String> setMode(@RequestBody Map<String, String> body) {
        return modeService.setMode(body.get("mode"));
    }
}