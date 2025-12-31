package main

import (
	"fmt"
	"log"
	"net/http"
	"sync/atomic"
	"time"
	// REAL IMPLEMENTATION (uncomment when backend is ready):
	// "bytes"
	// "encoding/json"
)

func (dm *DeviceManager) checkBackendAuthorization(mac string) (bool, int) {
	// MOCK: Always return authorized for testing
	log.Printf("Checking authorization for %s (MOCKED - always returns true)", mac)
	return true, 30 // 30 minutes

	/* REAL IMPLEMENTATION (uncomment when backend is ready):

	   req := AuthRequest{
	       DeviceMAC:  mac,
	       PiDeviceID: dm.piDeviceID,
	   }

	   body, err := json.Marshal(req)
	   if err != nil {
	       log.Printf("Failed to marshal request: %v", err)
	       return false, 0
	   }

	   client := &http.Client{Timeout: 10 * time.Second}

	   resp, err := client.Post(
	       dm.backendURL + "/api/pi/authorize-mac",
	       "application/json",
	       bytes.NewBuffer(body),
	   )

	   if err != nil {
	       log.Printf("Backend error: %v", err)
	       return false, 0
	   }
	   defer resp.Body.Close()

	   if resp.StatusCode != 200 {
	       log.Printf("Backend returned status %d", resp.StatusCode)
	       return false, 0
	   }

	   var authResp AuthResponse
	   if err := json.NewDecoder(resp.Body).Decode(&authResp); err != nil {
	       log.Printf("Failed to parse response: %v", err)
	       return false, 0
	   }

	   if authResp.Authorized {
	       log.Printf("✓ Backend authorized %s for %d minutes", mac, authResp.DurationMinutes)
	   } else {
	       log.Printf("✗ Backend denied authorization for %s", mac)
	   }

	   return authResp.Authorized, authResp.DurationMinutes
	*/
}

func sendHeartbeat(dm *DeviceManager) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	client := &http.Client{Timeout: 5 * time.Second}
	var sequenceID int64 = 0

	for range ticker.C {
		atomic.AddInt64(&sequenceID, 1)
		currentSeq := atomic.LoadInt64(&sequenceID)
		timestamp := time.Now().Unix()

		url := fmt.Sprintf("%s/healthcheck?device_id=%s&sequence_id=%d&timestamp=%d",
			dm.backendURL, dm.piDeviceID, currentSeq, timestamp)

		resp, err := client.Get(url)
		if err != nil {
			log.Printf("💓❌ Heartbeat failed: %v", err)
			continue
		}

		if resp.StatusCode != http.StatusOK {
			log.Printf("💓⚠️ Heartbeat returned status %d", resp.StatusCode)
		} else {
			log.Printf("💓 Heartbeat #%d sent successfully", currentSeq)
		}

		resp.Body.Close()
	}
}
