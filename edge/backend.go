package main

import (
	"fmt"
	"log"
	"net/http"
	"sync/atomic"
	"time"
)

// sendHeartbeat sends periodic heartbeat signals to the backend server
func sendHeartbeat(dm *DeviceManager) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	client := &http.Client{Timeout: 5 * time.Second}
	var sequenceID int64 = 0

	for range ticker.C {
		atomic.AddInt64(&sequenceID, 1)
		currentSeq := atomic.LoadInt64(&sequenceID)
		timestamp := time.Now().Unix()

		// Include session count in heartbeat
		dm.mu.RLock()
		sessionCount := len(dm.sessions)
		dm.mu.RUnlock()

		url := fmt.Sprintf("%s/healthcheck?device_id=%s&sequence_id=%d&timestamp=%d&sessions=%d",
			dm.backendURL, dm.piDeviceID, currentSeq, timestamp, sessionCount)

		resp, err := client.Get(url)
		if err != nil {
			log.Printf("💓❌ Heartbeat failed: %v", err)
			continue
		}

		if resp.StatusCode != http.StatusOK {
			log.Printf("💓⚠️ Heartbeat returned status %d", resp.StatusCode)
		} else {
			log.Printf("💓 Heartbeat #%d sent successfully (sessions: %d)", currentSeq, sessionCount)
		}

		resp.Body.Close()
	}
}
