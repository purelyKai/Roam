package main

import (
    "bytes"
    "encoding/json"
    "log"
    "net/http"
    "time"
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
