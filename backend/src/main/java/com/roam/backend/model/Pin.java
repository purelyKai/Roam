package com.roam.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "pins")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String deviceId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Double lat;

    @Column(nullable = false)
    private Double lng;

    @Column(nullable = false)
    private String ssid;

    @Column(nullable = true)
    private Double price;

    @Column(nullable = true)
    private String stripePaymentId;

    @Column(nullable = true)
    private String iconUrl;

    @Column(nullable = true)
    private Long allowedListId; // FK for allowlist (can be null for now)

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
