package com.roam.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.roam.backend.model.WifiSessionRecord;

/**
 * Repository for WifiSessionRecord entities (SQL history table).
 */
public interface WifiSessionRecordRepository extends JpaRepository<WifiSessionRecord, Long> {

    /**
     * Find a session record by its token.
     */
    Optional<WifiSessionRecord> findBySessionToken(String sessionToken);

    /**
     * Check if a session exists with the given token.
     */
    boolean existsBySessionToken(String sessionToken);

    /**
     * Find all sessions for a specific hotspot.
     */
    List<WifiSessionRecord> findByHotspotIdOrderByCreatedAtDesc(Long hotspotId);

    /**
     * Find all active sessions for a hotspot.
     */
    List<WifiSessionRecord> findByHotspotIdAndStatus(Long hotspotId, String status);

    /**
     * Find all sessions for a customer device.
     */
    List<WifiSessionRecord> findByCustomerDeviceIdOrderByCreatedAtDesc(String customerDeviceId);

    /**
     * Find sessions with a specific status.
     */
    List<WifiSessionRecord> findByStatus(String status);

    /**
     * Update session status by token.
     */
    @Modifying
    @Query("UPDATE WifiSessionRecord s SET s.status = :status WHERE s.sessionToken = :token")
    int updateStatusByToken(@Param("token") String token, @Param("status") String status);

    /**
     * Update client IP for a session.
     */
    @Modifying
    @Query("UPDATE WifiSessionRecord s SET s.clientIp = :clientIp WHERE s.sessionToken = :token")
    int updateClientIpByToken(@Param("token") String token, @Param("clientIp") String clientIp);

    /**
     * Mark expired sessions (where current time > expires_at) as expired.
     */
    @Modifying
    @Query("UPDATE WifiSessionRecord s SET s.status = 'expired' WHERE s.status = 'active' AND s.expiresAt < :currentTimeMillis")
    int markExpiredSessions(@Param("currentTimeMillis") long currentTimeMillis);

    /**
     * Count active sessions for a hotspot.
     */
    long countByHotspotIdAndStatus(Long hotspotId, String status);

    /**
     * Count total sessions for a hotspot.
     */
    long countByHotspotId(Long hotspotId);
}
