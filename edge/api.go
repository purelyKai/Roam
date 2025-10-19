package main

import (
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "os/exec"
    "bufio"
    "time"
)

func startAPIServer(dm *DeviceManager, port string) {
    // Enable CORS for all routes
    mux := http.NewServeMux()
    
    mux.HandleFunc("/api/devices", corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
        handleGetDevices(w, r, dm)
    }))
    
    mux.HandleFunc("/api/logs/stream", corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
        handleLogStream(w, r)
    }))
    
    mux.HandleFunc("/health", corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
        json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
    }))
    
    addr := ":" + port
    log.Printf("🌐 Starting API server on %s", addr)
    
    if err := http.ListenAndServe(addr, mux); err != nil {
        log.Fatalf("Failed to start API server: %v", err)
    }
}

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
        
        if r.Method == "OPTIONS" {
            w.WriteHeader(http.StatusOK)
            return
        }
        
        next(w, r)
    }
}

type DeviceResponse struct {
    MAC         string    `json:"mac"`
    Status      string    `json:"status"`
    GrantedAt   time.Time `json:"granted_at"`
    ExpiresAt   time.Time `json:"expires_at"`
    Duration    int       `json:"duration_minutes"`
    TimeLeft    int       `json:"time_left_minutes"`
    SignalInfo  string    `json:"signal_info,omitempty"`
}

func handleGetDevices(w http.ResponseWriter, r *http.Request, dm *DeviceManager) {
    dm.mu.RLock()
    defer dm.mu.RUnlock()
    
    devices := make([]DeviceResponse, 0, len(dm.devices))
    now := time.Now()
    
    for mac, session := range dm.devices {
        timeLeft := int(session.ExpiresAt.Sub(now).Minutes())
        if timeLeft < 0 {
            timeLeft = 0
        }
        
        status := "active"
        if now.After(session.ExpiresAt) {
            status = "expired"
        }
        
        // Get signal strength info
        info := getDeviceInfo(mac)
        signalInfo := ""
        if signal, ok := info["signal"]; ok {
            signalInfo = signal
        }
        
        devices = append(devices, DeviceResponse{
            MAC:        mac,
            Status:     status,
            GrantedAt:  session.GrantedAt,
            ExpiresAt:  session.ExpiresAt,
            Duration:   session.Duration,
            TimeLeft:   timeLeft,
            SignalInfo: signalInfo,
        })
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "devices": devices,
        "count":   len(devices),
    })
}

func handleLogStream(w http.ResponseWriter, r *http.Request) {
    // Set headers for SSE
    w.Header().Set("Content-Type", "text/event-stream")
    w.Header().Set("Cache-Control", "no-cache")
    w.Header().Set("Connection", "keep-alive")
    
    // Flush headers
    flusher, ok := w.(http.Flusher)
    if !ok {
        http.Error(w, "Streaming not supported", http.StatusInternalServerError)
        return
    }
    
    log.Println("📡 New log stream client connected")
    
    // Start journalctl process
    cmd := exec.Command("sudo", "journalctl", "-u", "edge", "-f", "-n", "50")
    stdout, err := cmd.StdoutPipe()
    if err != nil {
        log.Printf("Failed to create pipe: %v", err)
        http.Error(w, "Failed to start log stream", http.StatusInternalServerError)
        return
    }
    
    if err := cmd.Start(); err != nil {
        log.Printf("Failed to start journalctl: %v", err)
        http.Error(w, "Failed to start log stream", http.StatusInternalServerError)
        return
    }
    
    defer func() {
        cmd.Process.Kill()
        log.Println("📡 Log stream client disconnected")
    }()
    
    scanner := bufio.NewScanner(stdout)
    
    // Send initial connection message
    fmt.Fprintf(w, "data: {\"type\":\"connected\",\"message\":\"Log stream started\"}\n\n")
    flusher.Flush()
    
    // Stream logs
    for scanner.Scan() {
        line := scanner.Text()
        
        // Send log line as SSE event
        fmt.Fprintf(w, "data: {\"type\":\"log\",\"message\":%q,\"timestamp\":%q}\n\n",
            line, time.Now().Format(time.RFC3339))
        flusher.Flush()
        
        // Check if client disconnected
        select {
        case <-r.Context().Done():
            return
        default:
        }
    }
    
    if err := scanner.Err(); err != nil {
        log.Printf("Scanner error: %v", err)
    }
}
