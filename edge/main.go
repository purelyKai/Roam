package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"
)

const GATEWAY_IP = "192.168.4.1"

func main() {
	log.Println("🚀 Roam Edge Service Starting...")

	// Get config from environment variables
	backendURL := getEnv("BACKEND_URL", "http://localhost:5835")
	piDeviceID := getEnv("PI_DEVICE_ID", "pi_unknown")
	apiPort := getEnv("API_PORT", "7241")

	log.Printf("Backend URL: %s", backendURL)
	log.Printf("Device ID: %s", piDeviceID)
	log.Printf("API Port: %s", apiPort)

	dm := &DeviceManager{
		sessions:       make(map[string]*TokenSession),
		deviceSessions: make(map[string]string),
		ipSessions:     make(map[string]string),
		backendURL:     backendURL,
		piDeviceID:     piDeviceID,
	}

	// Setup graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		sig := <-sigChan
		log.Printf("⚠️ Received signal %v, shutting down...", sig)

		// Cleanup iptables rules
		CleanupCaptivePortalRules(GATEWAY_IP, CAPTIVE_PORTAL_PORT)

		os.Exit(0)
	}()

	log.Println("📡 Starting Captive Portal mode (token-based authentication)")

	// Setup iptables rules for captive portal
	if err := SetupCaptivePortalRules(GATEWAY_IP, CAPTIVE_PORTAL_PORT); err != nil {
		log.Printf("⚠️ Failed to setup captive portal rules: %v", err)
	}

	// Start captive portal HTTP server
	go startCaptivePortalServer(dm)

	// Start cleanup of expired token sessions
	go dm.cleanupExpiredTokenSessions()

	// Start HTTP API server for dashboard
	go startAPIServer(dm, apiPort)

	// Start health check service
	go sendHeartbeat(dm)

	log.Println("✅ Service running - captive portal authentication enabled")

	// Keep running
	select {}
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
