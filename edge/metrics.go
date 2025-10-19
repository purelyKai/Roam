package main

import (
    "bytes"
    "encoding/json"
    "log"
    "net/http"
    "os/exec"
    "strings"
    "time"
)

type MetricsPayload struct {
    PiDeviceID       string  `json:"pi_device_id"`
    DevicesConnected int     `json:"devices_connected"`
    ThroughputMbps   float64 `json:"throughput_mbps"`
    CanAcceptDevices bool    `json:"can_accept_connections"`
}

func startMetricsReporter(backendURL, deviceID string) {
    ticker := time.NewTicker(30 * time.Second)
    defer ticker.Stop()
    
    for range ticker.C {
        metrics := collectMetrics(deviceID)
        sendMetrics(backendURL, metrics)
    }
}

func collectMetrics(deviceID string) *MetricsPayload {
    cmd := exec.Command("iw", "dev", "wlan0", "station", "dump")
    output, _ := cmd.Output()
    deviceCount := strings.Count(string(output), "Station")
    
    throughput := 0.0
    
    return &MetricsPayload{
        PiDeviceID:       deviceID,
        DevicesConnected: deviceCount,
        ThroughputMbps:   throughput,
        CanAcceptDevices: deviceCount < 10,
    }
}

func sendMetrics(backendURL string, metrics *MetricsPayload) {
    body, _ := json.Marshal(metrics)
    url := backendURL + "/api/pi/metrics"
    
    resp, err := http.Post(url, "application/json", bytes.NewBuffer(body))
    if err != nil {
        log.Printf("Failed to send metrics: %v", err)
        return
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != 200 {
        log.Printf("Metrics upload failed: %d", resp.StatusCode)
    }
}
