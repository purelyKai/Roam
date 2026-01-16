package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"
)

// startCaptivePortalServer starts the captive portal HTTP server
func startCaptivePortalServer(dm *DeviceManager) {
	mux := http.NewServeMux()

	// Captive portal splash page (fallback for manual browser access)
	mux.HandleFunc("/", dm.splashHandler)
	mux.HandleFunc("/splash", dm.splashHandler)

	// Authentication endpoint (called by mobile app)
	mux.HandleFunc("/auth", dm.authHandler)

	// Status endpoint for debugging
	mux.HandleFunc("/status", dm.portalStatusHandler)

	// Captive portal detection endpoints (for various OS)
	mux.HandleFunc("/hotspot-detect.html", dm.captiveDetectHandler) // iOS
	mux.HandleFunc("/generate_204", dm.captiveDetectHandler)        // Android
	mux.HandleFunc("/connecttest.txt", dm.captiveDetectHandler)     // Windows
	mux.HandleFunc("/ncsi.txt", dm.captiveDetectHandler)            // Windows
	mux.HandleFunc("/redirect", dm.captiveDetectHandler)            // Generic

	addr := ":" + CAPTIVE_PORTAL_PORT
	log.Printf("🌐 Starting Captive Portal server on %s", addr)

	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("Failed to start captive portal server: %v", err)
	}
}

// splashHandler shows a splash page for users who manually open a browser
func (dm *DeviceManager) splashHandler(w http.ResponseWriter, r *http.Request) {
	log.Printf("📱 Splash page accessed from %s", r.RemoteAddr)

	html := `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WiFi Authentication Required</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            text-align: center;
            padding: 40px;
            background: rgba(255,255,255,0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            max-width: 400px;
        }
        h1 { margin-bottom: 20px; }
        p { opacity: 0.9; line-height: 1.6; }
        .icon { font-size: 64px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">📱</div>
        <h1>WiFi Authentication Required</h1>
        <p>Please use the <strong>Roam</strong> mobile app to connect to this WiFi hotspot.</p>
        <p>Open the app, select this hotspot, and complete your purchase to get connected.</p>
    </div>
</body>
</html>`

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(html))
}

// captiveDetectHandler handles captive portal detection requests
// This triggers the device's captive portal login screen
func (dm *DeviceManager) captiveDetectHandler(w http.ResponseWriter, r *http.Request) {
	clientIP := getClientIP(r)
	log.Printf("🔍 Captive portal detection from %s (%s)", clientIP, r.URL.Path)

	// Check if this IP is already authenticated
	dm.mu.RLock()
	_, authenticated := dm.ipSessions[clientIP]
	dm.mu.RUnlock()

	if authenticated {
		// Already authenticated - return success response
		if strings.Contains(r.URL.Path, "generate_204") {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		w.Header().Set("Content-Type", "text/html")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("<HTML><HEAD><TITLE>Success</TITLE></HEAD><BODY>Success</BODY></HTML>"))
		return
	}

	// Not authenticated - redirect to captive portal
	// This triggers the captive portal popup on mobile devices
	portalURL := fmt.Sprintf("http://%s:%s/splash", GATEWAY_IP, CAPTIVE_PORTAL_PORT)
	http.Redirect(w, r, portalURL, http.StatusFound)
}

// authHandler handles token-based authentication from the mobile app
func (dm *DeviceManager) authHandler(w http.ResponseWriter, r *http.Request) {
	// Enable CORS for mobile app
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(TokenAuthResponse{
			Success: false,
			Error:   "Method not allowed",
		})
		return
	}

	// Parse request
	var req TokenAuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("❌ Failed to parse auth request: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(TokenAuthResponse{
			Success: false,
			Error:   "Invalid request body",
		})
		return
	}

	clientIP := getClientIP(r)
	log.Printf("🔐 Auth request from IP %s, DeviceID: %s, Token: %s...",
		clientIP, req.DeviceID, truncateToken(req.Token))

	// Check if this device already has an active session
	dm.mu.Lock()
	defer dm.mu.Unlock()

	if existingToken, exists := dm.deviceSessions[req.DeviceID]; exists {
		if session, ok := dm.sessions[existingToken]; ok {
			if time.Now().Before(session.ExpiresAt) {
				// Valid existing session - add new IP if needed
				if !contains(session.ActiveIPs, clientIP) {
					session.ActiveIPs = append(session.ActiveIPs, clientIP)
					dm.ipSessions[clientIP] = existingToken
					allowIPAccess(clientIP)
					log.Printf("🔄 Reconnection: Device %s with new IP %s", req.DeviceID, clientIP)
				}

				w.Header().Set("Content-Type", "application/json")
				json.NewEncoder(w).Encode(TokenAuthResponse{
					Success: true,
					Message: "Reconnected successfully",
				})
				return
			}
			// Session expired - clean up
			dm.cleanupTokenSession(existingToken)
		}
	}

	// New session - validate token with backend
	validationResp, err := dm.validateTokenWithBackend(req.Token)
	if err != nil || !validationResp.Valid {
		log.Printf("❌ Token validation failed for %s: %v", req.Token, err)
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(TokenAuthResponse{
			Success: false,
			Error:   "Invalid or expired token",
		})
		return
	}

	// Calculate expiry time
	var expiresAt time.Time
	if validationResp.ExpiresAt > 0 {
		expiresAt = time.UnixMilli(validationResp.ExpiresAt)
	} else {
		expiresAt = time.Now().Add(time.Duration(validationResp.DurationMinutes) * time.Minute)
	}

	// Create new session
	session := &TokenSession{
		Token:     req.Token,
		DeviceID:  req.DeviceID,
		ActiveIPs: []string{clientIP},
		ExpiresAt: expiresAt,
		Duration:  validationResp.DurationMinutes,
		GrantedAt: time.Now(),
		UserID:    validationResp.UserID,
		PinID:     validationResp.PinID,
	}

	dm.sessions[req.Token] = session
	dm.deviceSessions[req.DeviceID] = req.Token
	dm.ipSessions[clientIP] = req.Token

	// Grant internet access
	allowIPAccess(clientIP)

	log.Printf("✅ New session created: Device %s, IP %s, Token %s, Expires: %s",
		req.DeviceID, clientIP, truncateToken(req.Token), expiresAt.Format("15:04:05"))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(TokenAuthResponse{
		Success: true,
		Message: "Authentication successful",
	})
}

// portalStatusHandler returns the status of active sessions (for debugging)
func (dm *DeviceManager) portalStatusHandler(w http.ResponseWriter, r *http.Request) {
	dm.mu.RLock()
	defer dm.mu.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	json.NewEncoder(w).Encode(StatusResponse{
		ActiveSessions: len(dm.sessions),
		Sessions:       dm.sessions,
	})
}

// validateTokenWithBackend validates a session token with the central backend
func (dm *DeviceManager) validateTokenWithBackend(token string) (*BackendValidationResponse, error) {
	url := fmt.Sprintf("%s/api/session/validate?token=%s", dm.backendURL, token)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return nil, fmt.Errorf("backend request failed: %w", err)
	}
	defer resp.Body.Close()

	var validationResp BackendValidationResponse
	if err := json.NewDecoder(resp.Body).Decode(&validationResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return &validationResp, nil // Return the response even if not valid
	}

	return &validationResp, nil
}

// cleanupTokenSession removes a session and revokes access for all its IPs
func (dm *DeviceManager) cleanupTokenSession(token string) {
	if session, ok := dm.sessions[token]; ok {
		// Revoke access for all IPs
		for _, ip := range session.ActiveIPs {
			revokeIPAccess(ip)
			delete(dm.ipSessions, ip)
		}
		delete(dm.deviceSessions, session.DeviceID)
		delete(dm.sessions, token)
		log.Printf("🧹 Cleaned up session: %s", truncateToken(token))
	}
}

// cleanupExpiredTokenSessions periodically removes expired sessions
func (dm *DeviceManager) cleanupExpiredTokenSessions() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		now := time.Now()

		dm.mu.Lock()
		for token, session := range dm.sessions {
			if now.After(session.ExpiresAt) {
				log.Printf("⏰ Session expired: %s (DeviceID: %s)",
					truncateToken(token), session.DeviceID)
				dm.cleanupTokenSession(token)
			}
		}
		dm.mu.Unlock()
	}
}

// Helper functions

func getClientIP(r *http.Request) string {
	// Check X-Forwarded-For header first
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		return strings.TrimSpace(parts[0])
	}
	// Fall back to RemoteAddr
	ip := r.RemoteAddr
	if colonIdx := strings.LastIndex(ip, ":"); colonIdx != -1 {
		ip = ip[:colonIdx]
	}
	return ip
}

func truncateToken(token string) string {
	if len(token) > 8 {
		return token[:8] + "..."
	}
	return token
}

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}
