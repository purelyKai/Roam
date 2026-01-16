package com.roam.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

/**
 * Transaction represents a payment record for WiFi access.
 * Tracks Stripe payments and revenue splitting between platform and business.
 */
@Entity
@Table(name = "transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Stripe Payment Intent ID (e.g., "pi_1234567890").
     */
    @Column(name = "payment_intent_id", nullable = false, unique = true)
    private String paymentIntentId;

    /**
     * The hotspot this transaction is for.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hotspot_id", nullable = false)
    private Hotspot hotspot;

    /**
     * Total amount charged to customer in cents.
     */
    @Column(name = "amount_cents", nullable = false)
    private Integer amountCents;

    /**
     * Platform fee (your cut) in cents. Default 20% of amount.
     */
    @Column(name = "platform_fee_cents", nullable = false)
    private Integer platformFeeCents;

    /**
     * Business payout amount in cents. Default 80% of amount.
     */
    @Column(name = "business_payout_cents", nullable = false)
    private Integer businessPayoutCents;

    /**
     * Duration of WiFi access purchased in minutes.
     */
    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    /**
     * Transaction status: pending, succeeded, failed, refunded.
     */
    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "pending";

    /**
     * Customer's mobile device ID (UUID) for support purposes.
     */
    @Column(name = "customer_device_id", length = 36)
    private String customerDeviceId;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }

    /**
     * Transaction status constants.
     */
    public static final String STATUS_PENDING = "pending";
    public static final String STATUS_SUCCEEDED = "succeeded";
    public static final String STATUS_FAILED = "failed";
    public static final String STATUS_REFUNDED = "refunded";

    /**
     * Platform fee percentage (20%).
     */
    public static final double PLATFORM_FEE_PERCENTAGE = 0.20;

    /**
     * Calculate platform fee and business payout from total amount.
     * @param amountCents Total amount in cents
     * @return Array of [platformFeeCents, businessPayoutCents]
     */
    public static int[] calculateSplit(int amountCents) {
        int platformFee = (int) Math.round(amountCents * PLATFORM_FEE_PERCENTAGE);
        int businessPayout = amountCents - platformFee;
        return new int[] { platformFee, businessPayout };
    }

    /**
     * Mark transaction as succeeded.
     */
    public void markSucceeded() {
        this.status = STATUS_SUCCEEDED;
        this.completedAt = Instant.now();
    }

    /**
     * Mark transaction as failed.
     */
    public void markFailed() {
        this.status = STATUS_FAILED;
    }

    /**
     * Mark transaction as refunded.
     */
    public void markRefunded() {
        this.status = STATUS_REFUNDED;
    }
}
