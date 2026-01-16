package com.roam.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * Represents a WiFi session stored in Redis.
 * This is used for token-based authentication with edge devices.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WifiSession implements Serializable {

    private static final long serialVersionUID = 1L;

    private String sessionToken;
    private String userId;
    private String pinId;
    private String deviceId; // Edge device ID
    private String ssid;
    private String password;
    private int durationMinutes;
    private long createdAt;
    private long expiresAt;
    private String stripePaymentId;
}
