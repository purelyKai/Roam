package com.roam.backend.dto.response;

import lombok.*;

/**
 * Response DTO for session validation requests from edge devices.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ValidateSessionResponse {

    private boolean valid;
    private String userId;
    private String pinId;
    private int durationMinutes;
    private long expiresAt;
    private String message;
}
