package com.example.distribute.controller;

import com.example.distribute.service.MapService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/map")
public class MapController {
    @Autowired
    private MapService mapService;

    @GetMapping("/paths")
    public Object getPaths(@RequestParam Long from, @RequestParam Long to) throws IOException {
        return mapService.getVehiclePaths(from, to);
    }

    @GetMapping("/heatmap")
    public Object getHeatmap(@RequestParam Long from, @RequestParam Long to) throws IOException {
        return mapService.getHeatmapData(from, to);
    }
}