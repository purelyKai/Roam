package main

import (
    "log"
    "net/http"
)

func main() {
    log.Println("Roam Edge Service Starting...")
    
    // Load configuration
    config := LoadConfig()
    
    // Initialize services
    auth := NewAuthService(config.BackendURL)
    ipt := NewIPTablesManager()
    
    // Setup HTTP handlers
    http.HandleFunc("/", handleCaptivePortal)
    http.HandleFunc("/connect", func(w http.ResponseWriter, r *http.Request) {
        handleConnect(w, r, auth, ipt)
    })
    http.HandleFunc("/status", handleStatus)

    // Start metrics reporter (sends to backend every 30s)
    go startMetricsReporter(config.BackendURL, config.PiDeviceID)
    
    // Start session cleanup (checks expired sessions every minute)
    go startSessionCleanup(ipt)
    
    log.Println("Captive portal running on :80")
    log.Fatal(http.ListenAndServe(":80", nil))
}
