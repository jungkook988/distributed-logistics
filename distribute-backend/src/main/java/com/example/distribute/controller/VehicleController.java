package com.example.distribute.controller;

import com.example.distribute.service.VehicleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/vehicles")
public class VehicleController {
	@Autowired
	private VehicleService vehicleService;
	
	@GetMapping("/{id}/location")
	public Map<String, Object> getVehicleLocation(@PathVariable("id") String vehicleId) {
		return vehicleService.getCurrentLocation(vehicleId);
	}
	
	@GetMapping("/{id}/history")
	public List<Map<String, Object>> getVehicleHistory(@PathVariable("id") String vehicleId, @RequestParam("from") long fromTimestamp) {
		return vehicleService.getLocationHistory(vehicleId, fromTimestamp);
	}
	
	@GetMapping("/status")
    public List<Map<String, Object>> listAllStatuses() {
        return vehicleService.getAllCurrentStatuses();
    }
}
