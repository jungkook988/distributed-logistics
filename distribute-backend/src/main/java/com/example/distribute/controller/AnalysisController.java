package com.example.distribute.controller;

import com.example.distribute.service.AnalysisService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/analysis")
public class AnalysisController {
    @Autowired
    private AnalysisService analysisService;

    @GetMapping("/summary")
    public Map<String, Object> getSummary(@RequestParam Long from, @RequestParam Long to) {
        return analysisService.getSummary(from, to);
    }

    @GetMapping("/trends")
    public List<Map<String, Object>> getTrends(
            @RequestParam String metric,
            @RequestParam String interval,
            @RequestParam Long from,
            @RequestParam Long to) {
        return analysisService.getTrends(metric, interval, from, to);
    }

    @GetMapping("/regions")
    public List<Map<String, Object>> getRegionAnalysis(
            @RequestParam String metric,
            @RequestParam Long from,
            @RequestParam Long to) {
        return analysisService.getRegionData(metric, from, to);
    }

    @GetMapping("/export")
    public byte[] exportData(
            @RequestParam String format,
            @RequestParam String type,
            @RequestParam Long from,
            @RequestParam Long to) {
        return analysisService.export(format, type, from, to);
    }
}