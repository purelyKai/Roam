package com.roam.backend.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.roam.backend.model.Pin;
import com.roam.backend.repository.PinRepository;

@RestController
@CrossOrigin(origins = "*") // Allow frontend access
public class PinController {

    private static final Logger logger = LoggerFactory.getLogger(PinController.class);

    @Autowired
    private PinRepository pinRepository;

    // Fetch all pins within a radius
    @GetMapping("/pins")
    public List<Pin> getPins(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "1000") double radius // meters
    ) {
        return pinRepository.findAllWithinRadius(lat, lng, radius);
    }

    // Create a new pin
    @PostMapping("/pins")
    public Pin createPin(@RequestBody Pin pin) {
        return pinRepository.save(pin);
    }

    // Register a Pi device (called by setup.sh on Raspberry Pi)
    @PostMapping("/api/register-pi")
    public ResponseEntity<Map<String, Object>> registerPi(
            @RequestParam("device_id") String deviceId,
            @RequestParam("name") String name,
            @RequestParam("ssid") String ssid,
            @RequestParam("lat") Double latitude,
            @RequestParam("lng") Double longitude,
            @RequestParam(value = "icon_url", required = false) String iconUrl
    ) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Check if device already exists
            Pin pin = pinRepository.findByDeviceId(deviceId)
                    .orElse(Pin.builder()
                            .deviceId(deviceId)
                            .name(name)
                            .ssid(ssid)
                            .lat(latitude)
                            .lng(longitude)
                            .iconUrl(iconUrl)
                            .build());

            // Update existing device information
            pin.setName(name);
            pin.setSsid(ssid);
            pin.setLat(latitude);
            pin.setLng(longitude);
            
            if (iconUrl != null && !iconUrl.isEmpty()) {
                pin.setIconUrl(iconUrl);
            }

            // Save to database
            pinRepository.save(pin);

            logger.info("✅ Registered/Updated Pi Device: {} | Name: {} | SSID: {} | Location: {}, {}",
                    deviceId, name, ssid, latitude, longitude);

            response.put("success", true);
            response.put("message", "Device registered successfully");
            response.put("device_id", deviceId);
            response.put("name", name);
            response.put("ssid", ssid);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("❌ Failed to register Pi Device: {}", e.getMessage(), e);

            response.put("success", false);
            response.put("message", "Failed to register device: " + e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
