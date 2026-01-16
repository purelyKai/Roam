package com.roam.backend.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.roam.backend.model.Hotspot;

/**
 * Repository for Hotspot entities.
 */
public interface HotspotRepository extends JpaRepository<Hotspot, Long> {

    /**
     * Find all hotspots within a radius using PostGIS earthdistance.
     */
    @Query(value = """
        SELECT * FROM hotspots
        WHERE is_active = true
        AND earth_distance(
            ll_to_earth(:lat, :lng),
            ll_to_earth(latitude, longitude)
        ) < :radius
        """, nativeQuery = true)
    List<Hotspot> findAllWithinRadius(
            @Param("lat") double lat,
            @Param("lng") double lng,
            @Param("radius") double radius);

    /**
     * Find a hotspot by its device ID (UUID from edge device).
     */
    Optional<Hotspot> findByDeviceId(String deviceId);

    /**
     * Check if a hotspot exists with the given device ID.
     */
    boolean existsByDeviceId(String deviceId);

    /**
     * Find all active hotspots.
     */
    List<Hotspot> findByIsActiveTrue();

    /**
     * Find all online hotspots.
     */
    List<Hotspot> findByIsOnlineTrue();

    /**
     * Find hotspots that have a Stripe account configured.
     */
    List<Hotspot> findByStripeAccountIdIsNotNull();

    /**
     * Update online status for a hotspot.
     */
    @Modifying
    @Query("UPDATE Hotspot h SET h.isOnline = :isOnline, h.lastHeartbeatAt = :heartbeatAt WHERE h.deviceId = :deviceId")
    int updateOnlineStatus(
            @Param("deviceId") String deviceId,
            @Param("isOnline") boolean isOnline,
            @Param("heartbeatAt") Instant heartbeatAt);

    /**
     * Mark hotspots as offline if no heartbeat received within threshold.
     */
    @Modifying
    @Query("UPDATE Hotspot h SET h.isOnline = false WHERE h.isOnline = true AND h.lastHeartbeatAt < :threshold")
    int markStaleHotspotsOffline(@Param("threshold") Instant threshold);
}
