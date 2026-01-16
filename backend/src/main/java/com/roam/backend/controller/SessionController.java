package com.roam.backend.controller;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.roam.backend.dto.request.CreateSessionRequest;
import com.roam.backend.dto.response.CreateSessionResponse;
import com.roam.backend.dto.response.ValidateSessionResponse;
import com.roam.backend.service.SessionService;

import jakarta.validation.Valid;

/**
 * Controller for managing WiFi session tokens.
 * Provides endpoints for creating and validating sessions.
 */
@RestController
@RequestMapping("/api/session")
@CrossOrigin(origins = "*")
public class SessionController {

    private static final Logger logger = LoggerFactory.getLogger(SessionController.class);

    private final SessionService sessionService;

    public SessionController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    /**
     * Creates a new WiFi session after successful payment.
     * Called by the mobile app after Stripe payment is confirmed.
     * 
     * POST /api/session/create
     * 
     * @param request Contains userId, pinId, durationMinutes, and stripePaymentId
     * @return Session token and WiFi credentials
     */
    @PostMapping("/create")
    public ResponseEntity<?> createSession(@Valid @RequestBody CreateSessionRequest request) {
        try {
            logger.info("Creating session for user {} on pin {} for {} minutes",
                    request.getUserId(), request.getPinId(), request.getDurationMinutes());

            CreateSessionResponse response = sessionService.createSession(request);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            logger.error("Failed to create session: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage(),
                    "success", false
            ));
        } catch (Exception e) {
            logger.error("Unexpected error creating session: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "Failed to create session",
                    "success", false
            ));
        }
    }

    /**
     * Validates a session token.
     * Called by edge devices to verify user authentication.
     * 
     * GET /api/session/validate?token={token}
     * 
     * @param token The session token to validate
     * @return 200 OK if valid, 401 Unauthorized if invalid/expired
     */
    @GetMapping("/validate")
    public ResponseEntity<ValidateSessionResponse> validateSession(@RequestParam String token) {
        logger.info("Validating session token: {}", token);

        ValidateSessionResponse response = sessionService.validateSession(token);

        if (response.isValid()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }

    /**
     * Extends an existing session.
     * Called when user purchases additional time.
     * 
     * POST /api/session/extend?token={token}&minutes={minutes}
     * 
     * @param token The session token to extend
     * @param minutes Additional minutes to add
     * @return Updated session details
     */
    @PostMapping("/extend")
    public ResponseEntity<?> extendSession(
            @RequestParam String token,
            @RequestParam int minutes) {
        try {
            logger.info("Extending session {} by {} minutes", token, minutes);

            return sessionService.extendSession(token, minutes)
                    .map(response -> ResponseEntity.ok((Object) response))
                    .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                            "error", "Session not found",
                            "success", false
                    )));

        } catch (Exception e) {
            logger.error("Failed to extend session: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "Failed to extend session",
                    "success", false
            ));
        }
    }

    /**
     * Invalidates (ends) a session.
     * Called when user manually disconnects or admin revokes access.
     * 
     * DELETE /api/session/{token}
     * 
     * @param token The session token to invalidate
     * @return Success/failure response
     */
    @DeleteMapping("/{token}")
    public ResponseEntity<?> invalidateSession(@PathVariable String token) {
        logger.info("Invalidating session: {}", token);

        boolean deleted = sessionService.invalidateSession(token);

        if (deleted) {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Session invalidated"
            ));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "success", false,
                    "message", "Session not found"
            ));
        }
    }

    /**
     * Gets session details.
     * 
     * GET /api/session/{token}
     * 
     * @param token The session token
     * @return Session details if found
     */
    @GetMapping("/{token}")
    public ResponseEntity<?> getSession(@PathVariable String token) {
        return sessionService.getSession(token)
                .map(session -> ResponseEntity.ok((Object) session))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                        "error", "Session not found",
                        "success", false
                )));
    }
}
