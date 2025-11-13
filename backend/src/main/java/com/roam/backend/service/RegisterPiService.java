package com.roam.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
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
  public Pin registerPi(
    @RequestParam double lat,
    @RequestParam double lng,
    @RequestParam String name
  ) {
    Pin pin = new Pin();
    pin.setLat(lat);
    pin.setLng(lng);
    pin.setName(name);
    pin.setSsid("Roam_CoffeeShop");
    pin.setPrice(5.0);

    return pinRepository.save(pin);
  }
}
