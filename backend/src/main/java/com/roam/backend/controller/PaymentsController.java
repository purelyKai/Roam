package com.roam.backend.controller;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.roam.backend.service.PaymentService;
import com.roam.backend.service.PaymentService.PaymentIntentResponse;
import com.stripe.exception.StripeException;

/**
 * Controller for payment endpoints.
 * Creates Payment Intents for the mobile Stripe SDK.
 */
@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentsController {

    private static final Logger logger = LoggerFactory.getLogger(PaymentsController.class);

    private final PaymentService paymentService;

    public PaymentsController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    /**
     * Request body for creating a payment intent.
     */
    public record CreatePaymentIntentRequest(
            Long hotspotId,
            int durationMinutes,
            String customerDeviceId) {
    }

    /**
     * Creates a Payment Intent for WiFi access purchase.
     * Returns a client secret for the mobile Stripe SDK to confirm the payment.
     *
     * POST /api/payments/create-intent
     *
     * Request body:
     * {
     *   "hotspotId": 1,
     *   "durationMinutes": 30,
     *   "customerDeviceId": "uuid-from-mobile-device"
     * }
     *
     * Response:
     * {
     *   "clientSecret": "pi_xxx_secret_xxx",
     *   "paymentIntentId": "pi_xxx",
     *   "amountCents": 60,
     *   "durationMinutes": 30,
     *   "hotspotId": "1",
     *   "hotspotName": "Coffee Shop WiFi"
     * }
     */
    @PostMapping("/create-intent")
    public ResponseEntity<?> createPaymentIntent(@RequestBody CreatePaymentIntentRequest request) {
        try {
            if (request.hotspotId() == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "hotspotId is required",
                        "success", false));
            }

            if (request.durationMinutes() <= 0) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "durationMinutes must be positive",
                        "success", false));
            }

            logger.info("Creating payment intent for hotspot {} | Duration: {} min | Customer: {}",
                    request.hotspotId(), request.durationMinutes(), request.customerDeviceId());

            PaymentIntentResponse response = paymentService.createPaymentIntent(
                    request.hotspotId(),
                    request.durationMinutes(),
                    request.customerDeviceId());

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            logger.error("Bad request: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage(),
                    "success", false));

        } catch (StripeException e) {
            logger.error("Stripe error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "Payment processing error",
                    "success", false));

        } catch (Exception e) {
            logger.error("Unexpected error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "Internal server error",
                    "success", false));
        }
    }

    /**
     * Get price quote for a hotspot and duration.
     * Does not create a payment intent - just returns pricing info.
     *
     * POST /api/payments/quote
     */
    @PostMapping("/quote")
    public ResponseEntity<?> getPriceQuote(@RequestBody CreatePaymentIntentRequest request) {
        try {
            if (request.hotspotId() == null || request.durationMinutes() <= 0) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "hotspotId and positive durationMinutes required",
                        "success", false));
            }

            // For now, use a simple calculation
            // In a real app, you might fetch the hotspot to get its specific price
            int pricePerMinuteCents = 2; // Default
            int totalCents = pricePerMinuteCents * request.durationMinutes();

            return ResponseEntity.ok(Map.of(
                    "durationMinutes", request.durationMinutes(),
                    "pricePerMinuteCents", pricePerMinuteCents,
                    "totalCents", totalCents,
                    "totalFormatted", String.format("$%.2f", totalCents / 100.0)));

        } catch (Exception e) {
            logger.error("Error calculating quote: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "Failed to calculate quote",
                    "success", false));
        }
    }
}
