package main

import (
	"log"
	"time"
)

func (dm *DeviceManager) monitorNewDevices() {
	ticker := time.NewTicker(CHECK_INTERVAL)
	defer ticker.Stop()

	for range ticker.C {
		connectedMACs := getConnectedDevices()

		for _, mac := range connectedMACs {
			dm.mu.RLock()
			_, exists := dm.devices[mac]
			dm.mu.RUnlock()

			if !exists {
				log.Printf("📱 New device connected: %s", mac)
				dm.handleNewDevice(mac)
			}
		}

		// Check for disconnected devices
		dm.removeDisconnectedDevices(connectedMACs)
	}
}

func (dm *DeviceManager) handleNewDevice(mac string) {
	// Check with backend if device is authorized
	authorized, duration := dm.checkBackendAuthorization(mac)

	if !authorized {
		log.Printf("🚫 Device %s not authorized (payment not verified)", mac)
		return
	}

	// Grant internet access
	if err := allowDevice(mac); err != nil {
		log.Printf("❌ Failed to grant access to %s: %v", mac, err)
		return
	}

	// Track session
	expiresAt := time.Now().Add(time.Duration(duration) * time.Minute)
	session := &DeviceSession{
		MAC:       mac,
		ExpiresAt: expiresAt,
		Duration:  duration,
		GrantedAt: time.Now(),
	}

	dm.mu.Lock()
	dm.devices[mac] = session
	dm.mu.Unlock()

	log.Printf("✅ Granted internet to %s for %d minutes (until %s)",
		mac, duration, expiresAt.Format("15:04:05"))
}

func (dm *DeviceManager) cleanupExpiredDevices() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		now := time.Now()

		dm.mu.Lock()
		for mac, session := range dm.devices {
			if now.After(session.ExpiresAt) {
				log.Printf("⏰ Session expired for %s (was granted %d minutes ago)",
					mac, int(now.Sub(session.GrantedAt).Minutes()))

				if err := blockDevice(mac); err != nil {
					log.Printf("❌ Failed to block %s: %v", mac, err)
				} else {
					log.Printf("🚫 Removed internet access for %s", mac)
					delete(dm.devices, mac)
				}
			}
		}
		dm.mu.Unlock()
	}
}

func (dm *DeviceManager) removeDisconnectedDevices(connectedMACs []string) {
	// Create set of currently connected MACs
	connectedSet := make(map[string]bool)
	for _, mac := range connectedMACs {
		connectedSet[mac] = true
	}

	// Remove devices that are no longer connected
	dm.mu.Lock()
	for mac := range dm.devices {
		if !connectedSet[mac] {
			log.Printf("📴 Device %s disconnected, cleaning up", mac)
			blockDevice(mac) // Clean up iptables rule
			delete(dm.devices, mac)
		}
	}
	dm.mu.Unlock()
}
