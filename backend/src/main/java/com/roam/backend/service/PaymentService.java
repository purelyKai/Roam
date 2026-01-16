package com.roam.backend.service;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.roam.backend.model.Hotspot;
import com.roam.backend.model.Transaction;
import com.roam.backend.repository.HotspotRepository;
import com.roam.backend.repository.TransactionRepository;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;

import io.github.cdimascio.dotenv.Dotenv;

/**
 * Service for handling Stripe Connect payments.
 * Manages payment intents with destination charges for revenue splitting.
 */
@Service
public class PaymentService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentService.class);

    private final HotspotRepository hotspotRepository;
    private final TransactionRepository transactionRepository;

    public PaymentService(HotspotRepository hotspotRepository, TransactionRepository transactionRepository) {
        this.hotspotRepository = hotspotRepository;
        this.transactionRepository = transactionRepository;

        // Initialize Stripe API key
        Dotenv dotenv = Dotenv.load();
        Stripe.apiKey = dotenv.get("STRIPE_SECRET");
    }

    /**
     * Response containing payment intent details for the mobile app.
     */
    public record PaymentIntentResponse(
            String clientSecret,
            String paymentIntentId,
            int amountCents,
            int durationMinutes,
            String hotspotId,
            String hotspotName) {
    }

    /**
     * Creates a Payment Intent for WiFi access purchase.
     * Uses Stripe Connect destination charges to split revenue.
     *
     * @param hotspotId       The hotspot ID
     * @param durationMinutes Duration of WiFi access in minutes
     * @param customerDeviceId Customer's mobile device UUID
     * @return PaymentIntentResponse with client secret for mobile SDK
     */
    @Transactional
    public PaymentIntentResponse createPaymentIntent(Long hotspotId, int durationMinutes, String customerDeviceId)
            throws StripeException {

        // Find the hotspot
        Hotspot hotspot = hotspotRepository.findById(hotspotId)
                .orElseThrow(() -> new IllegalArgumentException("Hotspot not found: " + hotspotId));

        // Calculate pricing
        int amountCents = hotspot.calculatePriceCents(durationMinutes);
        int[] split = Transaction.calculateSplit(amountCents);
        int platformFeeCents = split[0];
        int businessPayoutCents = split[1];

        logger.info("Creating payment intent for hotspot {} | Amount: {}¢ | Platform fee: {}¢ | Business payout: {}¢",
                hotspotId, amountCents, platformFeeCents, businessPayoutCents);

        // Build Payment Intent parameters
        PaymentIntentCreateParams.Builder paramsBuilder = PaymentIntentCreateParams.builder()
                .setAmount((long) amountCents)
                .setCurrency("usd")
                .setAutomaticPaymentMethods(
                        PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                .setEnabled(true)
                                .build())
                .putMetadata("hotspot_id", hotspotId.toString())
                .putMetadata("duration_minutes", String.valueOf(durationMinutes))
                .putMetadata("customer_device_id", customerDeviceId != null ? customerDeviceId : "");

        // If hotspot has a connected Stripe account, use destination charge
        if (hotspot.getStripeAccountId() != null && !hotspot.getStripeAccountId().isEmpty()) {
            paramsBuilder.setApplicationFeeAmount((long) platformFeeCents)
                    .setTransferData(
                            PaymentIntentCreateParams.TransferData.builder()
                                    .setDestination(hotspot.getStripeAccountId())
                                    .build());
            logger.info("Using Stripe Connect destination charge to account: {}", hotspot.getStripeAccountId());
        } else {
            // No connected account - all revenue goes to platform
            logger.warn("Hotspot {} has no Stripe account configured - all revenue goes to platform", hotspotId);
        }

        // Create the Payment Intent
        PaymentIntent paymentIntent = PaymentIntent.create(paramsBuilder.build());

        // Create pending transaction record
        Transaction transaction = Transaction.builder()
                .paymentIntentId(paymentIntent.getId())
                .hotspot(hotspot)
                .amountCents(amountCents)
                .platformFeeCents(platformFeeCents)
                .businessPayoutCents(businessPayoutCents)
                .durationMinutes(durationMinutes)
                .customerDeviceId(customerDeviceId)
                .status(Transaction.STATUS_PENDING)
                .build();

        transactionRepository.save(transaction);

        logger.info("✅ Created Payment Intent {} for {} minutes at hotspot {}",
                paymentIntent.getId(), durationMinutes, hotspot.getName());

        return new PaymentIntentResponse(
                paymentIntent.getClientSecret(),
                paymentIntent.getId(),
                amountCents,
                durationMinutes,
                hotspotId.toString(),
                hotspot.getName());
    }

    /**
     * Handles successful payment webhook.
     * Updates transaction status and returns data needed to create WiFi session.
     *
     * @param paymentIntentId The Stripe Payment Intent ID
     * @return Map with transaction details for session creation
     */
    @Transactional
    public Map<String, Object> handlePaymentSuccess(String paymentIntentId) {
        Transaction transaction = transactionRepository.findByPaymentIntentId(paymentIntentId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found: " + paymentIntentId));

        transaction.markSucceeded();
        transactionRepository.save(transaction);

        Hotspot hotspot = transaction.getHotspot();

        logger.info("✅ Payment succeeded for transaction {} | Hotspot: {} | Duration: {} min",
                transaction.getId(), hotspot.getName(), transaction.getDurationMinutes());

        Map<String, Object> result = new HashMap<>();
        result.put("transactionId", transaction.getId());
        result.put("hotspotId", hotspot.getId());
        result.put("deviceId", hotspot.getDeviceId());
        result.put("durationMinutes", transaction.getDurationMinutes());
        result.put("customerDeviceId", transaction.getCustomerDeviceId());
        result.put("ssid", hotspot.getSsid());
        result.put("password", hotspot.getPassword());

        return result;
    }

    /**
     * Handles failed payment webhook.
     *
     * @param paymentIntentId The Stripe Payment Intent ID
     */
    @Transactional
    public void handlePaymentFailed(String paymentIntentId) {
        transactionRepository.findByPaymentIntentId(paymentIntentId)
                .ifPresent(transaction -> {
                    transaction.markFailed();
                    transactionRepository.save(transaction);
                    logger.warn("❌ Payment failed for transaction {}", transaction.getId());
                });
    }

    /**
     * Get transaction by payment intent ID.
     */
    public Transaction getTransaction(String paymentIntentId) {
        return transactionRepository.findByPaymentIntentId(paymentIntentId)
                .orElse(null);
    }
}
