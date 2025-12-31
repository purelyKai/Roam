#!/bin/bash

# Roam Edge Setup Script
# This script sets up the Raspberry Pi as a WiFi hotspot with payment validation

set -e  # Exit on error

echo "🚀 Starting Roam Edge Setup..."

# Load configuration from .env file
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    echo "Please copy .env.example to .env and configure it."
    exit 1
fi

# Source .env file
set -a  # automatically export all variables
source .env
set +a

# Generate or load persistent device UUID
DEVICE_ID_FILE="/etc/roam-device-id"
if [ -f "$DEVICE_ID_FILE" ]; then
    DEVICE_UUID=$(cat "$DEVICE_ID_FILE")
    echo "📝 Using existing device ID: $DEVICE_UUID"
else
    DEVICE_UUID=$(cat /proc/sys/kernel/random/uuid)
    echo "$DEVICE_UUID" > "$DEVICE_ID_FILE"
    chmod 644 "$DEVICE_ID_FILE"
    echo "🆕 Generated new device ID: $DEVICE_UUID"
fi

# Use hostname for human-readable name
PI_DEVICE_NAME="pi_$(hostname)"

# Set default API_PORT if not set
API_PORT="${API_PORT:-7241}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Step 1: Update system
echo ""
echo "Step 1: Updating system packages..."
apt update && apt upgrade -y
print_status "System updated"

# Step 2: Install required packages
echo ""
echo "Step 2: Installing required packages..."
apt install -y golang-go network-manager iptables-persistent
print_status "Packages installed"

# Step 3: Stop old services if they exist
echo ""
echo "Step 3: Stopping old services..."
systemctl stop hostapd 2>/dev/null || true
systemctl stop dnsmasq 2>/dev/null || true
systemctl stop edge 2>/dev/null || true
systemctl disable hostapd 2>/dev/null || true
systemctl disable dnsmasq 2>/dev/null || true
print_status "Old services stopped"

# Step 4: Enable IP forwarding
echo ""
echo "Step 4: Enabling IP forwarding..."
sysctl -w net.ipv4.ip_forward=1

# Make it permanent
if ! grep -q "^net.ipv4.ip_forward=1" /etc/sysctl.conf; then
    echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf
fi
print_status "IP forwarding enabled"

# Step 5: Create WiFi hotspot with NetworkManager
echo ""
echo "Step 5: Creating WiFi hotspot..."
echo "SSID: $SSID"
echo "Password: $PASSWORD"

# Delete existing hotspot if it exists
nmcli connection delete Hotspot 2>/dev/null || true

# Disconnect wlan0 to ensure clean state
nmcli device disconnect wlan0 2>/dev/null || true

# Restart NetworkManager for clean state
systemctl restart NetworkManager
sleep 3

# Create new hotspot
nmcli device wifi hotspot ifname wlan0 ssid "$SSID" password "$PASSWORD"

# Keep the hotspot down
nmcli connection down Hotspot 2>/dev/null || true

# Configure wifi band to 5GHz (802.11ac) on channel 36
nmcli connection modify Hotspot wifi.band a
nmcli connection modify Hotspot wifi.channel 36

# Enable auto-connect on boot
nmcli connection modify Hotspot connection.autoconnect yes

# Restart hotspot with new settings
nmcli connection up Hotspot

print_status "WiFi hotspot created"

# Step 6: Configure iptables
echo ""
echo "Step 6: Configuring firewall rules..."

# Flush existing FORWARD rules
iptables -F FORWARD

# Set default policy
iptables -P FORWARD DROP

# Allow established connections
iptables -A FORWARD -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT

# Allow DNS
iptables -A FORWARD -p udp --dport 53 -j ACCEPT
iptables -A FORWARD -p tcp --dport 53 -j ACCEPT

# NAT for internet access
iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE

# Save rules
netfilter-persistent save

print_status "Firewall configured"

# Step 7: Build Go application
echo ""
echo "Step 7: Building Roam Edge service..."
cd /home/admin/Roam/edge

# Initialize Go module if needed
if [ ! -f "go.mod" ]; then
    go mod init roam-edge
fi

go mod tidy
go build -o edge

print_status "Go application built"

# Step 8: Configure sudo for iptables
echo ""
echo "Step 8: Configuring sudo permissions..."

# Add sudo permission for iptables without password
if ! grep -q "admin.*iptables" /etc/sudoers.d/roam-edge 2>/dev/null; then
    echo "admin ALL=(ALL) NOPASSWD: /usr/sbin/iptables" > /etc/sudoers.d/roam-edge
    chmod 0440 /etc/sudoers.d/roam-edge
fi

print_status "Sudo configured"

# Step 9: Create systemd service
echo ""
echo "Step 9: Creating systemd service..."

cat > /etc/systemd/system/edge.service << EOF
[Unit]
Description=Roam Edge Service
After=network.target NetworkManager.service

[Service]
Type=simple
User=root
WorkingDirectory=/home/admin/Roam/edge
Environment="BACKEND_URL=$BACKEND_URL"
Environment="PI_DEVICE_ID=$DEVICE_UUID"
Environment="API_PORT=$API_PORT"
ExecStart=/home/admin/Roam/edge/edge
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
systemctl daemon-reload

# Enable and start service
systemctl enable edge
systemctl start edge

print_status "Systemd service created and started"

# Step 10: Verify everything is running
echo ""
echo "Step 10: Verifying setup..."

sleep 3

# Check hotspot
if nmcli connection show Hotspot >/dev/null 2>&1; then
    print_status "Hotspot is active"
else
    print_warning "Hotspot not detected"
fi

# Check edge service
if systemctl is-active --quiet edge; then
    print_status "Edge service is running"
else
    print_warning "Edge service is not running"
    echo "Check logs with: sudo journalctl -u edge -n 50"
fi

# Check IP forwarding
if [ "$(cat /proc/sys/net/ipv4/ip_forward)" = "1" ]; then
    print_status "IP forwarding is enabled"
else
    print_warning "IP forwarding is not enabled"
fi

# Step 11: Register device with backend
echo ""
echo "Step 11: Registering device with backend..."

response=$(curl -s -w "\n%{http_code}" -d "device_id=$DEVICE_UUID&name=$NAME&ssid=$SSID&lat=$LATITUDE&lng=$LONGITUDE&icon_url=$ICON_URL" "$BACKEND_URL/api/register-pi")
response_body=$(echo "$response" | sed '$d')
status_code=$(echo "$response" | tail -n 1)

if [[ "$status_code" -ge 200 && "$status_code" -lt 300 ]]; then
    print_status "Device successfully registered with backend"
else
    echo ""
    echo "❌ Failed to register device with backend"
    echo "Status code: $status_code"
    echo "Response: $response_body"
    echo ""
    echo "Device cannot operate without backend registration."
    echo "Running reset script to clean up..."
    
    # Run reset script to clean up
    if [ -f "./reset.sh" ]; then
        ./reset.sh
    fi
    
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ Roam Edge Setup Complete!"
echo "=========================================="
echo ""
echo "WiFi Network: $SSID"
echo "Password: $PASSWORD"
echo "Backend URL: $BACKEND_URL"
echo "Device UUID: $DEVICE_UUID"
echo ""
echo "Useful commands:"
echo "  - View logs: sudo journalctl -u edge -f"
echo "  - Restart service: sudo systemctl restart edge"
echo "  - Check status: sudo systemctl status edge"
echo "  - View connected devices: iw dev wlan0 station dump"
echo "  - View iptables: sudo iptables -L FORWARD -v -n"
echo ""
echo "To change configuration later:"
echo "  1. Edit .env file with your settings"
echo "  2. Re-run this setup script: sudo ./setup.sh"
echo ""
