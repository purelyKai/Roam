#!/bin/bash

# Roam Edge Setup Script
set -e

echo "🚀 Starting Roam Edge Setup..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Configuration
SSID="Roam_CoffeeShop"
PASSWORD="RoamPass1234"
BACKEND_URL="http://localhost:5835"
PI_DEVICE_ID="pi_$(hostname)"

echo "✓ Updating system..."
apt update -qq && apt upgrade -y -qq

echo "✓ Installing packages..."
apt install -y golang-go network-manager iptables-persistent >/dev/null 2>&1

echo "✓ Stopping old services..."
systemctl stop hostapd dnsmasq edge 2>/dev/null || true
systemctl disable hostapd dnsmasq 2>/dev/null || true

echo "✓ Enabling IP forwarding..."
sysctl -w net.ipv4.ip_forward=1 >/dev/null
grep -q "^net.ipv4.ip_forward=1" /etc/sysctl.conf || echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf

echo "✓ Creating WiFi hotspot..."
nmcli connection delete Hotspot 2>/dev/null || true
nmcli device wifi hotspot ssid "$SSID" password "$PASSWORD" >/dev/null
nmcli connection modify Hotspot connection.autoconnect yes
sleep 2

echo "✓ Configuring firewall..."
iptables -F FORWARD
iptables -P FORWARD DROP
iptables -A FORWARD -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
iptables -A FORWARD -p udp --dport 53 -j ACCEPT
iptables -A FORWARD -p tcp --dport 53 -j ACCEPT
iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE 2>/dev/null || \
iptables -t nat -A POSTROUTING -o wlan1 -j MASQUERADE 2>/dev/null || true
netfilter-persistent save >/dev/null 2>&1

echo "✓ Building Go application..."
cd /home/admin/Roam/edge
[ ! -f "go.mod" ] && go mod init roam-edge >/dev/null 2>&1
go mod tidy >/dev/null 2>&1
go build -o edge

echo "✓ Configuring sudo..."
echo "admin ALL=(ALL) NOPASSWD: /usr/sbin/iptables" > /etc/sudoers.d/roam-edge
chmod 0440 /etc/sudoers.d/roam-edge

echo "✓ Creating systemd service..."
cat > /etc/systemd/system/edge.service << EOF
[Unit]
Description=Roam Edge Service
After=network.target NetworkManager.service

[Service]
Type=simple
User=root
WorkingDirectory=/home/admin/Roam/edge
Environment="BACKEND_URL=$BACKEND_URL"
Environment="PI_DEVICE_ID=$PI_DEVICE_ID"
ExecStart=/home/admin/Roam/edge/edge
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable edge >/dev/null 2>&1
systemctl start edge

sleep 2

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "WiFi Network: $SSID"
echo "Password: $PASSWORD"
echo "Backend URL: $BACKEND_URL"
echo "Device ID: $PI_DEVICE_ID"
echo ""
echo "View logs: sudo journalctl -u edge -f"
echo "Edit config: sudo nano /etc/systemd/system/edge.service"
echo ""
