package com.roam.backend.service;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.roam.backend.dto.request.CreateSessionRequest;
import com.roam.backend.dto.response.CreateSessionResponse;
import com.roam.backend.dto.response.ValidateSessionResponse;
import com.roam.backend.model.Hotspot;
import com.roam.backend.model.Transaction;
import com.roam.backend.model.WifiSession;
import com.roam.backend.model.WifiSessionRecord;
import com.roam.backend.repository.HotspotRepository;
import com.roam.backend.repository.TransactionRepository;
import com.roam.backend.repository.WifiSessionRecordRepository;

/**
 * Service for managing WiFi session tokens.
 * Sessions are stored in Redis with automatic expiry, and also recorded in SQL for history.
 */
@Service
public class SessionService {

    private static final Logger logger = LoggerFactory.getLogger(SessionService.class);
    private static final String SESSION_KEY_PREFIX = "session:";

    private final RedisTemplate<String, WifiSession> redisTemplate;
    private final HotspotRepository hotspotRepository;
    private final TransactionRepository transactionRepository;
    private final WifiSessionRecordRepository sessionRecordRepository;

    public SessionService(
            RedisTemplate<String, WifiSession> redisTemplate,
            HotspotRepository hotspotRepository,
            TransactionRepository transactionRepository,
            WifiSessionRecordRepository sessionRecordRepository) {
        this.redisTemplate = redisTemplate;
        this.hotspotRepository = hotspotRepository;
        this.transactionRepository = transactionRepository;
        this.sessionRecordRepository = sessionRecordRepository;
    }

    /**
     * Creates a new WiFi session from a successful payment.
     * Called by the webhook handler after payment_intent.succeeded.
     *
     * @param hotspotId        The hotspot ID (as string)
     * @param durationMinutes  Session duration in minutes
     * @param customerDeviceId Customer's mobile device UUID
     * @param paymentIntentId  Stripe Payment Intent ID
     * @param transactionId    Transaction record ID
     * @return Session response with token and WiFi credentials
     */
    @Transactional
    public CreateSessionResponse createSessionFromPayment(
            String hotspotId,
            int durationMinutes,
            String customerDeviceId,
            String paymentIntentId,
            Long transactionId) {

        Hotspot hotspot = hotspotRepository.findById(Long.valueOf(hotspotId))
                .orElseThrow(() -> new IllegalArgumentException("Hotspot not found: " + hotspotId));

        // Transaction may be null if session is created without payment (e.g., legacy flow)
        Transaction transaction = transactionId != null
                ? transactionRepository.findById(transactionId).orElse(null)
                : null;

        String sessionToken = UUID.randomUUID().toString();
        long now = System.currentTimeMillis();
        long expiresAt = now + (durationMinutes * 60 * 1000L);

        // Create Redis session for real-time validation
        WifiSession session = WifiSession.builder()
                .sessionToken(sessionToken)
                .userId(customerDeviceId)
                .pinId(hotspotId) // Keeping field name for Redis compatibility
                .deviceId(hotspot.getDeviceId())
                .ssid(hotspot.getSsid())
                .password(hotspot.getPassword())
                .durationMinutes(durationMinutes)
                .createdAt(now)
                .expiresAt(expiresAt)
                .stripePaymentId(paymentIntentId)
                .build();

        String key = SESSION_KEY_PREFIX + sessionToken;
        redisTemplate.opsForValue().set(key, session, durationMinutes, TimeUnit.MINUTES);

        // Create SQL record for history
        WifiSessionRecord record = WifiSessionRecord.builder()
                .transaction(transaction)
                .hotspot(hotspot)
                .sessionToken(sessionToken)
                .durationMinutes(durationMinutes)
                .startedAt(now)
                .expiresAt(expiresAt)
                .customerDeviceId(customerDeviceId)
                .status(WifiSessionRecord.STATUS_ACTIVE)
                .build();

        sessionRecordRepository.save(record);

        logger.info("✅ Created session {} for customer {} on hotspot {} (duration: {} min)",
                sessionToken, customerDeviceId, hotspot.getName(), durationMinutes);

        return CreateSessionResponse.builder()
                .sessionToken(sessionToken)
                .ssid(hotspot.getSsid())
                .password(hotspot.getPassword())
                .durationMinutes(durationMinutes)
                .expiresAt(expiresAt)
                .pinId(hotspotId)
                .deviceId(hotspot.getDeviceId())
                .build();
    }

    /**
     * Creates a new WiFi session after successful payment (legacy method).
     * Called by the mobile app after Stripe payment is confirmed via deep link.
     *
     * @param request The session creation request
     * @return The session response with token and WiFi credentials
     * @throws IllegalArgumentException if the hotspot is not found
     */
    @Transactional
    public CreateSessionResponse createSession(CreateSessionRequest request) {
        return createSessionFromPayment(
                request.getPinId(),
                request.getDurationMinutes(),
                request.getUserId(),
                request.getStripePaymentId(),
                null);
    }

    /**
     * Validates a session token.
     * Called by edge devices to verify user authentication.
     *
     * @param token The session token to validate
     * @return Validation response with session details if valid
     */
    public ValidateSessionResponse validateSession(String token) {
        String key = SESSION_KEY_PREFIX + token;
        WifiSession session = redisTemplate.opsForValue().get(key);

        if (session == null) {
            logger.warn("❌ Session validation failed - token not found: {}", token);
            return ValidateSessionResponse.builder()
                    .valid(false)
                    .message("Session not found or expired")
                    .build();
        }

        if (System.currentTimeMillis() > session.getExpiresAt()) {
            logger.warn("❌ Session validation failed - token expired: {}", token);
            redisTemplate.delete(key);
            markSessionExpired(token);
            return ValidateSessionResponse.builder()
                    .valid(false)
                    .message("Session has expired")
                    .build();
        }

        logger.info("✅ Session validated: {} for user {} on hotspot {}",
                token, session.getUserId(), session.getPinId());

        return ValidateSessionResponse.builder()
                .valid(true)
                .userId(session.getUserId())
                .pinId(session.getPinId())
                .durationMinutes(session.getDurationMinutes())
                .expiresAt(session.getExpiresAt())
                .message("Session is valid")
                .build();
    }

    /**
     * Gets a session by token from Redis.
     */
    public Optional<WifiSession> getSession(String token) {
        String key = SESSION_KEY_PREFIX + token;
        WifiSession session = redisTemplate.opsForValue().get(key);
        return Optional.ofNullable(session);
    }

    /**
     * Extends an existing session duration.
     */
    @Transactional
    public Optional<CreateSessionResponse> extendSession(String token, int additionalMinutes) {
        String key = SESSION_KEY_PREFIX + token;
        WifiSession session = redisTemplate.opsForValue().get(key);

        if (session == null) {
            return Optional.empty();
        }

        long newExpiresAt = session.getExpiresAt() + (additionalMinutes * 60 * 1000L);
        int newDuration = session.getDurationMinutes() + additionalMinutes;
        session.setExpiresAt(newExpiresAt);
        session.setDurationMinutes(newDuration);

        Long ttl = redisTemplate.getExpire(key, TimeUnit.MINUTES);
        long newTtl = (ttl != null ? ttl : 0) + additionalMinutes;

        redisTemplate.opsForValue().set(key, session, newTtl, TimeUnit.MINUTES);

        // Update SQL record
        sessionRecordRepository.findBySessionToken(token).ifPresent(record -> {
            record.setExpiresAt(newExpiresAt);
            record.setDurationMinutes(newDuration);
            sessionRecordRepository.save(record);
        });

        logger.info("✅ Extended session {} by {} minutes (new expiry: {})",
                token, additionalMinutes, newExpiresAt);

        return Optional.of(CreateSessionResponse.builder()
                .sessionToken(token)
                .ssid(session.getSsid())
                .password(session.getPassword())
                .durationMinutes(newDuration)
                .expiresAt(newExpiresAt)
                .pinId(session.getPinId())
                .deviceId(session.getDeviceId())
                .build());
    }

    /**
     * Invalidates (deletes) a session.
     */
    @Transactional
    public boolean invalidateSession(String token) {
        String key = SESSION_KEY_PREFIX + token;
        Boolean deleted = redisTemplate.delete(key);

        if (Boolean.TRUE.equals(deleted)) {
            markSessionRevoked(token);
            logger.info("✅ Invalidated session: {}", token);
            return true;
        }

        return false;
    }

    /**
     * Mark a session as expired in the SQL record.
     */
    private void markSessionExpired(String token) {
        sessionRecordRepository.updateStatusByToken(token, WifiSessionRecord.STATUS_EXPIRED);
    }

    /**
     * Mark a session as revoked in the SQL record.
     */
    private void markSessionRevoked(String token) {
        sessionRecordRepository.updateStatusByToken(token, WifiSessionRecord.STATUS_REVOKED);
    }
}
