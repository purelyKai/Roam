package com.roam.backend.dto.response;

import lombok.*;

/**
 * Response DTO returned after creating a new WiFi session.
 * Contains session token and WiFi credentials for the mobile app.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateSessionResponse {

    private String sessionToken;
    private String ssid;
    private String password;
    private int durationMinutes;
    private long expiresAt;
    private String pinId;
    private String deviceId;
}
