package main

import (
	"log"
	"os"
)

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
		devices:    make(map[string]*DeviceSession),
		backendURL: backendURL,
		piDeviceID: piDeviceID,
	}

	// Start monitoring for new connections
	go dm.monitorNewDevices()

	// Start cleanup of expired sessions
	go dm.cleanupExpiredDevices()

	// Start HTTP API server for dashboard
	go startAPIServer(dm, apiPort)

	// Start health check service
	go sendHeartbeat(dm)

	log.Println("✅ Service running - monitoring for new devices...")

	// Keep running
	select {}
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
