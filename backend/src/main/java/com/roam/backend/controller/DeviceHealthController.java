package com.roam.backend.controller;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "*")
public class DeviceHealthController {

    private static final Logger logger = LoggerFactory.getLogger(DeviceHealthController.class);
    
    // Store last heartbeat info for each device (in-memory for now)
    private final Map<String, DeviceHeartbeat> deviceHeartbeats = new HashMap<>();

    @GetMapping("/healthcheck")
    public Map<String, Object> healthCheck(
            @RequestParam("device_id") String deviceId,
            @RequestParam("sequence_id") long sequenceId,
            @RequestParam("timestamp") long timestamp
    ) {
        long serverTimestamp = Instant.now().getEpochSecond();
        long latency = serverTimestamp - timestamp;
        
        // Update device heartbeat info
        DeviceHeartbeat heartbeat = new DeviceHeartbeat(
            deviceId, 
            sequenceId, 
            timestamp, 
            serverTimestamp
        );
        deviceHeartbeats.put(deviceId, heartbeat);
        
        // Log every 10th heartbeat to reduce log spam
        if (sequenceId % 10 == 0) {
            logger.info("💓 Heartbeat from device: {} | seq: {} | latency: {}s", 
                deviceId, sequenceId, latency);
        }
        
        // Return success response
        Map<String, Object> response = new HashMap<>();
        response.put("status", "ok");
        response.put("device_id", deviceId);
        response.put("sequence_id", sequenceId);
        response.put("server_timestamp", serverTimestamp);
        response.put("latency_seconds", latency);
        
        return response;
    }
    
    @GetMapping("/healthcheck/status")
    public Map<String, Object> getDeviceStatus(@RequestParam("device_id") String deviceId) {
        DeviceHeartbeat heartbeat = deviceHeartbeats.get(deviceId);
        
        Map<String, Object> response = new HashMap<>();
        if (heartbeat == null) {
            response.put("status", "unknown");
            response.put("message", "No heartbeat received from this device");
        } else {
            long now = Instant.now().getEpochSecond();
            long secondsSinceLastHeartbeat = now - heartbeat.serverTimestamp;
            boolean isOnline = secondsSinceLastHeartbeat < 90; // 3 missed heartbeats (30s interval)
            
            response.put("status", isOnline ? "online" : "offline");
            response.put("device_id", deviceId);
            response.put("last_sequence_id", heartbeat.sequenceId);
            response.put("last_heartbeat_timestamp", heartbeat.serverTimestamp);
            response.put("seconds_since_last_heartbeat", secondsSinceLastHeartbeat);
        }
        
        return response;
    }
    
    @GetMapping("/healthcheck/devices")
    public Map<String, Object> getAllDevicesStatus() {
        Map<String, Object> response = new HashMap<>();
        Map<String, Object> devices = new HashMap<>();
        long now = Instant.now().getEpochSecond();
        
        for (Map.Entry<String, DeviceHeartbeat> entry : deviceHeartbeats.entrySet()) {
            String deviceId = entry.getKey();
            DeviceHeartbeat heartbeat = entry.getValue();
            long secondsSinceLastHeartbeat = now - heartbeat.serverTimestamp;
            boolean isOnline = secondsSinceLastHeartbeat < 90;
            
            Map<String, Object> deviceInfo = new HashMap<>();
            deviceInfo.put("status", isOnline ? "online" : "offline");
            deviceInfo.put("last_sequence_id", heartbeat.sequenceId);
            deviceInfo.put("last_heartbeat_timestamp", heartbeat.serverTimestamp);
            deviceInfo.put("seconds_since_last_heartbeat", secondsSinceLastHeartbeat);
            
            devices.put(deviceId, deviceInfo);
        }
        
        response.put("devices", devices);
        response.put("total_devices", devices.size());
        
        return response;
    }
    
    // Inner class to store heartbeat data
    private static class DeviceHeartbeat {
        // String deviceId;
        long sequenceId;
        // long clientTimestamp;
        long serverTimestamp;
        
        DeviceHeartbeat(String deviceId, long sequenceId, long clientTimestamp, long serverTimestamp) {
            // this.deviceId = deviceId;
            this.sequenceId = sequenceId;
            // this.clientTimestamp = clientTimestamp;
            this.serverTimestamp = serverTimestamp;
        }
    }
}
