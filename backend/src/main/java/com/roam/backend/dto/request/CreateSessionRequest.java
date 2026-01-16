package com.roam.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * Request DTO for creating a new WiFi session after payment.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateSessionRequest {

    @NotBlank(message = "User ID is required")
    private String userId;

    @NotBlank(message = "Pin ID is required")
    private String pinId;

    @Min(value = 1, message = "Duration must be at least 1 minute")
    private int durationMinutes;

    private String stripePaymentId;
}
