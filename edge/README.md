# Roam Edge - Raspberry Pi WiFi Hotspot

Turns a Raspberry Pi into a monetized WiFi hotspot that validates sessions with a backend payment system.

## What It Does

1. Creates a WiFi access point on the Raspberry Pi
2. Detects devices connecting to the WiFi
3. Validates with backend that the device has paid
4. Grants time-limited internet access
5. Automatically disconnects when session expires

## Quick Start
```bash
cd /home/admin/Roam/edge
sudo ./setup.sh
```

The script will:
- Install all dependencies
- Create WiFi hotspot
- Configure firewall
- Build and start the service

## Configuration

After setup, edit the backend URL and device ID:
```bash
sudo nano /etc/systemd/system/edge.service
```

Change these lines:
```
Environment="BACKEND_URL=http://your-backend:5853"
Environment="PI_DEVICE_ID=pi_your_location"
```

Then reload:
```bash
sudo systemctl daemon-reload
sudo systemctl restart edge
```

## Change WiFi Settings
```bash
sudo nmcli connection delete Hotspot
sudo nmcli device wifi hotspot ssid "NewName" password "NewPassword"
sudo nmcli connection modify Hotspot connection.autoconnect yes
```

## Backend API

**POST /api/pi/authorize-mac**

Request:
```json
{
  "device_mac": "aa:bb:cc:dd:ee:ff",
  "pi_device_id": "pi_coffee_shop"
}
```

Response (if paid):
```json
{
  "authorized": true,
  "duration_minutes": 60
}
```

Response (if not paid):
```json
{
  "authorized": false,
  "duration_minutes": 0
}
```

## Useful Commands
```bash
# View live logs
sudo journalctl -u edge -f

# Restart service
sudo systemctl restart edge

# Check status
sudo systemctl status edge

# View connected devices
iw dev wlan0 station dump

# View firewall rules
sudo iptables -L FORWARD -v -n
```

## How It Works
```
User pays in mobile app
  ↓
Backend stores device MAC with session
  ↓
User connects to Pi WiFi (SSID + password)
  ↓
Pi detects new device every 5 seconds
  ↓
Pi asks backend: "Is this MAC authorized?"
  ↓
Backend checks if MAC has paid session
  ↓
If yes → Pi grants internet via iptables
  ↓
After duration → Pi removes access
```

## Troubleshooting

**Service won't start:**
```bash
sudo journalctl -u edge -n 50
```

**No internet on devices:**
```bash
# Check IP forwarding
cat /proc/sys/net/ipv4/ip_forward  # Must be 1

# Check NAT
sudo iptables -t nat -L -v -n
```

**WiFi not visible:**
```bash
nmcli connection show Hotspot
iwconfig wlan0  # Should show Mode:Master
```

## Development

Enable real backend (edit `backend.go`):
```go
// Comment out the mock return
// return true, 30

// Uncomment the real implementation
```

Then rebuild:
```bash
cd /home/admin/Roam/edge
go build -o edge
sudo systemctl restart edge
```

## File Structure
```
edge/
├── main.go              # Entry point
├── types.go             # Type definitions
├── device_manager.go    # Session management
├── backend.go           # Backend API calls
├── iptables.go          # Firewall control
├── utils.go             # Helper functions
├── setup.sh             # Setup script
└── README.md            # This file
```
