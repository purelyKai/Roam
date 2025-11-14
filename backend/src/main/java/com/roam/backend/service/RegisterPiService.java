package com.roam.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.graphql.GraphQlProperties.Http;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.roam.backend.model.Pin;
import com.roam.backend.repository.PinRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/register-pi")
@CrossOrigin(origins = "*")
public class RegisterPiService {
    
  @Autowired
  private PinRepository pinRepository;

  @PostMapping
  public ResponseEntity<?> registerPi(
    @RequestParam(required = true) Double lat,
    @RequestParam(required = true) Double lng,
    @RequestParam(required = true) String name,
    @RequestParam(required = true) String ssid
  ) {
        try {
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body("Invalid lat/lng values.");
        }

        Pin pin = new Pin();
        pin.setLat(lat);
        pin.setLng(lng);
        pin.setName(name);
        pin.setSsid(ssid);
        pin.setPrice(5.0);

        Pin savedPin = pinRepository.save(pin);
        return ResponseEntity.ok(savedPin);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error registering raspberry pi: " + e.getMessage());
        }
  }
}
