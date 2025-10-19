package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "log"
    "net"
    "net/http"
    "os/exec"
    "strings"
    "time"
)

type AuthService struct {
    backendURL string
    client     *http.Client
}

type ConnectRequest struct {
    SessionToken string `json:"session_token"`
}

type ValidationRequest struct {
    SessionToken string `json:"session_token"`
    DeviceMAC    string `json:"device_mac"`
    DeviceIP     string `json:"device_ip"`
}

type ValidationResponse struct {
    Valid           bool   `json:"valid"`
    UserID          int64  `json:"user_id"`
    DurationMinutes int    `json:"duration_minutes"`
    SessionID       int64  `json:"session_id"`
}

func NewAuthService(backendURL string) *AuthService {
    return &AuthService{
        backendURL: backendURL,
        client: &http.Client{
            Timeout: 10 * time.Second,
        },
    }
}

func handleConnect(w http.ResponseWriter, r *http.Request, auth *AuthService, ipt *IPTablesManager) {
    if r.Method != "POST" {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }
    
    var req ConnectRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        respondJSON(w, map[string]interface{}{"success": false, "error": "Invalid request"})
        return
    }
    
    clientIP := getClientIP(r)
    clientMAC := getMACFromIP(clientIP)
    
    if clientMAC == "" {
        log.Printf("Could not determine MAC for IP: %s", clientIP)
        respondJSON(w, map[string]interface{}{"success": false, "error": "Device identification failed"})
        return
    }
    
    log.Printf("Connection attempt: Token=%s MAC=%s IP=%s", req.SessionToken, clientMAC, clientIP)
    
    // Validate with backend
    valid, session := auth.ValidateSession(req.SessionToken, clientMAC, clientIP)
    
    if !valid {
        log.Printf("Validation failed for token: %s", req.SessionToken)
        respondJSON(w, map[string]interface{}{"success": false, "error": "Invalid or expired token"})
        return
    }
    
    // Add to iptables
    if err := ipt.AllowDevice(clientMAC); err != nil {
        log.Printf("Failed to add iptables rule: %v", err)
        respondJSON(w, map[string]interface{}{"success": false, "error": "Connection failed"})
        return
    }
    
    log.Printf("Device authenticated: MAC=%s UserID=%d Duration=%dm", clientMAC, session.UserID, session.DurationMinutes)
    
    // Schedule automatic disconnection
    go ipt.ScheduleDisconnect(clientMAC, session.DurationMinutes)
    
    respondJSON(w, map[string]interface{}{"success": true})
}

func (a *AuthService) ValidateSession(token, mac, ip string) (bool, *ValidationResponse) {
    // TEMPORARY: Skip backend validation for testing
    return true, &ValidationResponse{
        Valid:           true,
        UserID:          1,
        DurationMinutes: 10,
        SessionID:       1,
    }


    reqData := ValidationRequest{
        SessionToken: token,
        DeviceMAC:    mac,
        DeviceIP:     ip,
    }
    
    body, _ := json.Marshal(reqData)
    url := fmt.Sprintf("%s/api/pi/validate-session", a.backendURL)
    
    resp, err := a.client.Post(url, "application/json", bytes.NewBuffer(body))
    if err != nil {
        log.Printf("Backend validation error: %v", err)
        return false, nil
    }
    defer resp.Body.Close()
    
    var result ValidationResponse
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        log.Printf("Failed to parse validation response: %v", err)
        return false, nil
    }
    
    return result.Valid, &result
}

func getClientIP(r *http.Request) string {
    if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
        ips := strings.Split(xff, ",")
        return strings.TrimSpace(ips[0])
    }
    
    ip, _, _ := net.SplitHostPort(r.RemoteAddr)
    return ip
}

func getMACFromIP(ip string) string {
    cmd := exec.Command("ip", "neigh", "show", ip)
    output, err := cmd.Output()
    if err != nil {
        return ""
    }
    
    fields := strings.Fields(string(output))
    for i, field := range fields {
        if field == "lladdr" && i+1 < len(fields) {
            return strings.ToLower(fields[i+1])
        }
    }
    
    return ""
}

func respondJSON(w http.ResponseWriter, data interface{}) {
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(data)
}
