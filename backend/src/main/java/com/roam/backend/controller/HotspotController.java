package com.roam.backend.controller;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.roam.backend.model.Hotspot;
import com.roam.backend.repository.HotspotRepository;

/**
 * Controller for managing WiFi hotspots.
 * Handles hotspot registration, discovery, and status updates.
 */
@RestController
@CrossOrigin(origins = "*")
public class HotspotController {

    private static final Logger logger = LoggerFactory.getLogger(HotspotController.class);

    private final HotspotRepository hotspotRepository;

    public HotspotController(HotspotRepository hotspotRepository) {
        this.hotspotRepository = hotspotRepository;
    }

    /**
     * DTO for hotspot response to mobile app.
     * Excludes sensitive fields like Stripe account ID.
     */
    public record HotspotResponse(
            Long id,
            String deviceId,
            String name,
            String iconUrl,
            double latitude,
            double longitude,
            String ssid,
            String password,
            int pricePerMinuteCents,
            boolean isOnline) {

        public static HotspotResponse from(Hotspot h) {
            return new HotspotResponse(
                    h.getId(),
                    h.getDeviceId(),
                    h.getName(),
                    h.getIconUrl(),
                    h.getLatitude().doubleValue(),
                    h.getLongitude().doubleValue(),
                    h.getSsid(),
                    h.getPassword(),
                    h.getPricePerMinuteCents(),
                    h.getIsOnline());
        }
    }

    /**
     * Fetch all hotspots within a radius.
     * 
     * GET /hotspots?lat={lat}&lng={lng}&radius={radius}
     */
    @GetMapping("/hotspots")
    public List<HotspotResponse> getHotspots(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "1000") double radius) {

        return hotspotRepository.findAllWithinRadius(lat, lng, radius)
                .stream()
                .map(HotspotResponse::from)
                .toList();
    }

    /**
     * Get a specific hotspot by ID.
     * 
     * GET /hotspots/{id}
     */
    @GetMapping("/hotspots/{id}")
    public ResponseEntity<HotspotResponse> getHotspot(@PathVariable Long id) {
        return hotspotRepository.findById(id)
                .map(h -> ResponseEntity.ok(HotspotResponse.from(h)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Create a new hotspot (admin use).
     * 
     * POST /hotspots
     */
    @PostMapping("/hotspots")
    public Hotspot createHotspot(@RequestBody Hotspot hotspot) {
        return hotspotRepository.save(hotspot);
    }

    /**
     * Register a Pi device (called by setup.sh on Raspberry Pi).
     * Creates or updates a hotspot based on device_id.
     * 
     * POST /api/register-device
     */
    @PostMapping("/api/register-device")
    public ResponseEntity<Map<String, Object>> registerDevice(
            @RequestParam("device_id") String deviceId,
            @RequestParam("name") String name,
            @RequestParam("ssid") String ssid,
            @RequestParam("password") String password,
            @RequestParam("lat") Double latitude,
            @RequestParam("lng") Double longitude,
            @RequestParam(value = "icon_url", required = false) String iconUrl,
            @RequestParam(value = "price_per_minute_cents", required = false, defaultValue = "2") Integer pricePerMinuteCents) {

        Map<String, Object> response = new HashMap<>();

        try {
            // Upsert: find existing or create new
            Hotspot hotspot = hotspotRepository.findByDeviceId(deviceId)
                    .orElse(Hotspot.builder()
                            .deviceId(deviceId)
                            .build());

            // Update fields
            hotspot.setName(name);
            hotspot.setSsid(ssid);
            hotspot.setPassword(password);
            hotspot.setLatitude(BigDecimal.valueOf(latitude));
            hotspot.setLongitude(BigDecimal.valueOf(longitude));
            hotspot.setPricePerMinuteCents(pricePerMinuteCents);
            hotspot.setIsOnline(true);
            hotspot.setLastHeartbeatAt(Instant.now());

            if (iconUrl != null && !iconUrl.isEmpty()) {
                hotspot.setIconUrl(iconUrl);
            }

            hotspotRepository.save(hotspot);

            logger.info("✅ Registered/Updated Device: {} | Name: {} | SSID: {} | Location: {}, {}",
                    deviceId, name, ssid, latitude, longitude);

            response.put("success", true);
            response.put("message", "Device registered successfully");
            response.put("hotspot_id", hotspot.getId());
            response.put("device_id", deviceId);
            response.put("name", name);
            response.put("ssid", ssid);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("❌ Failed to register device: {}", e.getMessage(), e);

            response.put("success", false);
            response.put("message", "Failed to register device: " + e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Legacy endpoint for backwards compatibility with setup.sh.
     * Redirects to the new register-device endpoint.
     * 
     * POST /api/register-pi
     */
    @PostMapping("/api/register-pi")
    public ResponseEntity<Map<String, Object>> registerPi(
            @RequestParam("device_id") String deviceId,
            @RequestParam("name") String name,
            @RequestParam("ssid") String ssid,
            @RequestParam("password") String password,
            @RequestParam("lat") Double latitude,
            @RequestParam("lng") Double longitude,
            @RequestParam(value = "icon_url", required = false) String iconUrl) {

        // Delegate to the new endpoint
        return registerDevice(deviceId, name, ssid, password, latitude, longitude, iconUrl, 2);
    }

    /**
     * Heartbeat endpoint for edge devices to report online status.
     * 
     * POST /api/heartbeat
     */
    @PostMapping("/api/heartbeat")
    public ResponseEntity<Map<String, Object>> heartbeat(@RequestParam("device_id") String deviceId) {
        Map<String, Object> response = new HashMap<>();

        int updated = hotspotRepository.updateOnlineStatus(deviceId, true, Instant.now());

        if (updated > 0) {
            response.put("success", true);
            response.put("message", "Heartbeat received");
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "Device not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }
}
