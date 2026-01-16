package main

import (
	"sync"
	"time"
)

const CAPTIVE_PORTAL_PORT = "2050"

// DeviceManager manages connected devices and their sessions
type DeviceManager struct {
	sessions       map[string]*TokenSession // Token -> Session mapping
	deviceSessions map[string]string        // DeviceID -> Token mapping (for reconnections)
	ipSessions     map[string]string        // IP -> Token mapping (for traffic control)
	mu             sync.RWMutex
	backendURL     string
	piDeviceID     string
}

// TokenSession represents a token-based authentication session
type TokenSession struct {
	Token     string
	DeviceID  string   // Mobile device's unique ID
	ActiveIPs []string // List of IPs associated with this session
	ExpiresAt time.Time
	Duration  int // minutes
	GrantedAt time.Time
	UserID    string
	PinID     string
}

// TokenAuthRequest is the request from mobile app to authenticate with captive portal
type TokenAuthRequest struct {
	Token    string `json:"token"`
	DeviceID string `json:"deviceId"`
}

// TokenAuthResponse is the response from captive portal authentication
type TokenAuthResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
	Error   string `json:"error,omitempty"`
}

// BackendValidationResponse is the response from backend token validation
type BackendValidationResponse struct {
	Valid           bool   `json:"valid"`
	UserID          string `json:"userId"`
	PinID           string `json:"pinId"`
	DurationMinutes int    `json:"durationMinutes"`
	ExpiresAt       int64  `json:"expiresAt"`
	Message         string `json:"message"`
}

// StatusResponse is the response for the status endpoint
type StatusResponse struct {
	ActiveSessions int                      `json:"active_sessions"`
	Sessions       map[string]*TokenSession `json:"sessions"`
}

// TokenSessionResponse is the API response format for token sessions
type TokenSessionResponse struct {
	DeviceID  string    `json:"device_id"`
	Status    string    `json:"status"`
	GrantedAt time.Time `json:"granted_at"`
	ExpiresAt time.Time `json:"expires_at"`
	Duration  int       `json:"duration_minutes"`
	TimeLeft  int       `json:"time_left_minutes"`
	ActiveIPs []string  `json:"active_ips"`
	UserID    string    `json:"user_id,omitempty"`
}
