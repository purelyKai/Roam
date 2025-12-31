package com.roam.backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.roam.backend.model.Pin;
import com.roam.backend.repository.PinRepository;

@RestController
@RequestMapping("/pins")
@CrossOrigin(origins = "*") // Allow frontend access
public class PinController {

    @Autowired
    private PinRepository pinRepository;

    // Fetch all pins within a radius
    @GetMapping
    public List<Pin> getPins(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "1000") double radius // meters
    ) {
        return pinRepository.findAllWithinRadius(lat, lng, radius);
    }

    // Create a new pin
    @PostMapping
    public Pin createPin(@RequestBody Pin pin) {
        return pinRepository.save(pin);
    }
}
