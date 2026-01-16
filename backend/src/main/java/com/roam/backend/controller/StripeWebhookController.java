package com.roam.backend.controller;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.roam.backend.service.PaymentService;
import com.roam.backend.service.SessionService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;

import io.github.cdimascio.dotenv.Dotenv;

/**
 * Controller for Stripe webhook events.
 * Handles payment_intent.succeeded and payment_intent.payment_failed events.
 */
@RestController
@RequestMapping("/api/payments")
public class StripeWebhookController {

    private static final Logger logger = LoggerFactory.getLogger(StripeWebhookController.class);

    private final String webhookSecret;
    private final PaymentService paymentService;
    private final SessionService sessionService;

    public StripeWebhookController(PaymentService paymentService, SessionService sessionService) {
        Dotenv dotenv = Dotenv.load();
        this.webhookSecret = dotenv.get("STRIPE_WEBHOOK_SECRET");
        this.paymentService = paymentService;
        this.sessionService = sessionService;
    }

    /**
     * Handles Stripe webhook events.
     * 
     * POST /api/payments/webhook
     * 
     * Events handled:
     * - payment_intent.succeeded: Creates WiFi session
     * - payment_intent.payment_failed: Marks transaction as failed
     */
    @PostMapping(value = "/webhook", consumes = "application/json")
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {

        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            logger.error("❌ Invalid webhook signature");
            return ResponseEntity.status(400).body("Invalid signature");
        } catch (Exception e) {
            logger.error("❌ Error parsing webhook: {}", e.getMessage());
            return ResponseEntity.status(400).body("Error parsing webhook");
        }

        logger.info("Received Stripe webhook: {}", event.getType());

        try {
            switch (event.getType()) {
                case "payment_intent.succeeded" -> handlePaymentIntentSucceeded(event);
                case "payment_intent.payment_failed" -> handlePaymentIntentFailed(event);
                default -> logger.info("Unhandled event type: {}", event.getType());
            }
        } catch (Exception e) {
            logger.error("❌ Error handling webhook {}: {}", event.getType(), e.getMessage(), e);
            // Still return 200 to prevent Stripe retries for processing errors
            return ResponseEntity.ok("Error processing event");
        }

        return ResponseEntity.ok("OK");
    }

    /**
     * Handle successful payment - create WiFi session.
     */
    private void handlePaymentIntentSucceeded(Event event) {
        PaymentIntent paymentIntent = (PaymentIntent) event.getDataObjectDeserializer()
                .getObject()
                .orElseThrow(() -> new RuntimeException("Failed to deserialize PaymentIntent"));

        String paymentIntentId = paymentIntent.getId();
        logger.info("✅ Payment succeeded: {}", paymentIntentId);

        // Update transaction to succeeded and get session data
        Map<String, Object> transactionData = paymentService.handlePaymentSuccess(paymentIntentId);

        // Create WiFi session
        String hotspotId = transactionData.get("hotspotId").toString();
        int durationMinutes = (int) transactionData.get("durationMinutes");
        String customerDeviceId = (String) transactionData.get("customerDeviceId");
        Long transactionId = (Long) transactionData.get("transactionId");

        sessionService.createSessionFromPayment(
                hotspotId,
                durationMinutes,
                customerDeviceId,
                paymentIntentId,
                transactionId);

        logger.info("✅ WiFi session created for payment {}", paymentIntentId);
    }

    /**
     * Handle failed payment.
     */
    private void handlePaymentIntentFailed(Event event) {
        PaymentIntent paymentIntent = (PaymentIntent) event.getDataObjectDeserializer()
                .getObject()
                .orElseThrow(() -> new RuntimeException("Failed to deserialize PaymentIntent"));

        String paymentIntentId = paymentIntent.getId();
        logger.warn("❌ Payment failed: {}", paymentIntentId);

        paymentService.handlePaymentFailed(paymentIntentId);
    }
}
