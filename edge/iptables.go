package main

import (
    "fmt"
    "log"
    "os/exec"
    "sync"
    "time"
)

type IPTablesManager struct {
    activeSessions map[string]time.Time
    mu             sync.RWMutex
}

func NewIPTablesManager() *IPTablesManager {
    return &IPTablesManager{
        activeSessions: make(map[string]time.Time),
    }
}

func (ipt *IPTablesManager) AllowDevice(mac string) error {
    ipt.mu.Lock()
    defer ipt.mu.Unlock()
    
    cmd := exec.Command("sudo", "iptables", "-I", "FORWARD", "1",
        "-m", "mac", "--mac-source", mac, "-j", "ACCEPT")
    
    if err := cmd.Run(); err != nil {
        return fmt.Errorf("failed to add iptables rule: %w", err)
    }
    
    log.Printf("âœ“ Added iptables rule for MAC: %s", mac)
    return nil
}

func (ipt *IPTablesManager) BlockDevice(mac string) error {
    ipt.mu.Lock()
    defer ipt.mu.Unlock()
    
    cmd := exec.Command("sudo", "iptables", "-D", "FORWARD",
        "-m", "mac", "--mac-source", mac, "-j", "ACCEPT")
    
    if err := cmd.Run(); err != nil {
        return fmt.Errorf("failed to remove iptables rule: %w", err)
    }
    
    delete(ipt.activeSessions, mac)
    log.Printf("âœ— Removed iptables rule for MAC: %s", mac)
    return nil
}

func (ipt *IPTablesManager) IsAuthenticated(mac string) bool {
    cmd := exec.Command("sudo", "iptables", "-C", "FORWARD",
        "-m", "mac", "--mac-source", mac, "-j", "ACCEPT")
    
    return cmd.Run() == nil
}

func (ipt *IPTablesManager) ScheduleDisconnect(mac string, durationMinutes int) {
    expiryTime := time.Now().Add(time.Duration(durationMinutes) * time.Minute)
    
    ipt.mu.Lock()
    ipt.activeSessions[mac] = expiryTime
    ipt.mu.Unlock()
    
    log.Printf("Scheduled disconnect for %s in %d minutes", mac, durationMinutes)
    
    time.Sleep(time.Duration(durationMinutes) * time.Minute)
    
    if err := ipt.BlockDevice(mac); err != nil {
        log.Printf("Error disconnecting device: %v", err)
    }
}

func startSessionCleanup(ipt *IPTablesManager) {
    ticker := time.NewTicker(1 * time.Minute)
    defer ticker.Stop()
    
    for range ticker.C {
        ipt.mu.RLock()
        now := time.Now()
        for mac, expiry := range ipt.activeSessions {
            if now.After(expiry) {
                go ipt.BlockDevice(mac)
            }
        }
        ipt.mu.RUnlock()
    }
}
