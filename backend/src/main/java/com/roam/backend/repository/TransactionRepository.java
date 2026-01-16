package com.roam.backend.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.roam.backend.model.Transaction;

/**
 * Repository for Transaction entities.
 */
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    /**
     * Find a transaction by Stripe Payment Intent ID.
     */
    Optional<Transaction> findByPaymentIntentId(String paymentIntentId);

    /**
     * Check if a transaction exists for the given Payment Intent ID.
     */
    boolean existsByPaymentIntentId(String paymentIntentId);

    /**
     * Find all transactions for a specific hotspot.
     */
    List<Transaction> findByHotspotIdOrderByCreatedAtDesc(Long hotspotId);

    /**
     * Find all transactions with a specific status.
     */
    List<Transaction> findByStatus(String status);

    /**
     * Find all successful transactions for a hotspot.
     */
    List<Transaction> findByHotspotIdAndStatus(Long hotspotId, String status);

    /**
     * Find transactions created within a date range.
     */
    List<Transaction> findByCreatedAtBetween(Instant start, Instant end);

    /**
     * Calculate total revenue for a hotspot.
     */
    @Query("SELECT COALESCE(SUM(t.amountCents), 0) FROM Transaction t WHERE t.hotspot.id = :hotspotId AND t.status = 'succeeded'")
    Long getTotalRevenueCentsByHotspotId(@Param("hotspotId") Long hotspotId);

    /**
     * Calculate platform fees for a hotspot.
     */
    @Query("SELECT COALESCE(SUM(t.platformFeeCents), 0) FROM Transaction t WHERE t.hotspot.id = :hotspotId AND t.status = 'succeeded'")
    Long getTotalPlatformFeesCentsByHotspotId(@Param("hotspotId") Long hotspotId);

    /**
     * Calculate business payouts for a hotspot.
     */
    @Query("SELECT COALESCE(SUM(t.businessPayoutCents), 0) FROM Transaction t WHERE t.hotspot.id = :hotspotId AND t.status = 'succeeded'")
    Long getTotalBusinessPayoutCentsByHotspotId(@Param("hotspotId") Long hotspotId);

    /**
     * Count successful transactions for a hotspot.
     */
    long countByHotspotIdAndStatus(Long hotspotId, String status);
}
