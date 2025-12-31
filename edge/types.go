package main

import (
	"sync"
	"time"
)

const CHECK_INTERVAL = 5 * time.Second

type DeviceManager struct {
	devices    map[string]*DeviceSession
	mu         sync.RWMutex
	backendURL string
	piDeviceID string
}

type DeviceSession struct {
	MAC       string
	ExpiresAt time.Time
	Duration  int // minutes
	GrantedAt time.Time
}

type AuthRequest struct {
	DeviceMAC  string `json:"device_mac"`
	PiDeviceID string `json:"pi_device_id"`
}

type AuthResponse struct {
	Authorized      bool `json:"authorized"`
	DurationMinutes int  `json:"duration_minutes"`
}
