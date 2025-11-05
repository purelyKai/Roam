#!/bin/bash

# Roam Edge Reset Script
# This script undoes all changes and restores the Raspberry Pi to normal state

set -e  # Exit on error

echo "🔄 Starting Roam Edge Reset..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Step 1: Stop and remove edge service
echo ""
echo "Step 1: Removing edge service..."
systemctl stop edge 2>/dev/null || true
systemctl disable edge 2>/dev/null || true
rm -f /etc/systemd/system/edge.service
systemctl daemon-reload
print_status "Edge service removed"

# Step 2: Delete hotspot connection
echo ""
echo "Step 2: Removing WiFi hotspot..."
nmcli connection delete Hotspot 2>/dev/null || true
nmcli device disconnect wlan0 2>/dev/null || true
print_status "Hotspot removed"

# Step 3: Restart NetworkManager to reset wlan0
echo ""
echo "Step 3: Resetting NetworkManager..."
systemctl restart NetworkManager
sleep 3
print_status "NetworkManager reset"

# Step 4: Reset iptables to default (allow everything)
echo ""
echo "Step 4: Resetting firewall rules..."

# Flush all rules
iptables -F
iptables -t nat -F
iptables -t mangle -F
iptables -X

# Set default policies to ACCEPT
iptables -P INPUT ACCEPT
iptables -P FORWARD ACCEPT
iptables -P OUTPUT ACCEPT

# Remove NAT rule
iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE 2>/dev/null || true

# Save the reset rules
netfilter-persistent save

print_status "Firewall reset to default"

# Step 5: Disable IP forwarding
echo ""
echo "Step 5: Disabling IP forwarding..."
sysctl -w net.ipv4.ip_forward=0

# Remove from sysctl.conf
sed -i '/^net.ipv4.ip_forward=1/d' /etc/sysctl.conf

print_status "IP forwarding disabled"

# Step 6: Remove sudo configuration
echo ""
echo "Step 6: Removing sudo configuration..."
rm -f /etc/sudoers.d/roam-edge
print_status "Sudo configuration removed"

# Step 7: Clean up Go build artifacts (optional)
echo ""
echo "Step 7: Cleaning up build artifacts..."
if [ -d "/home/admin/Roam/edge" ]; then
    cd /home/admin/Roam/edge
    rm -f edge 2>/dev/null || true
    print_status "Build artifacts cleaned"
else
    print_warning "Edge directory not found, skipping cleanup"
fi

# Step 8: Verify wlan0 is back to normal
echo ""
echo "Step 8: Verifying wlan0 status..."
sleep 2

if iwconfig wlan0 2>/dev/null | grep -q "Mode:Managed"; then
    print_status "wlan0 is in Managed mode (normal client mode)"
else
    print_warning "wlan0 mode: $(iwconfig wlan0 2>/dev/null | grep Mode || echo 'Unknown')"
fi

echo ""
echo "=========================================="
echo "✅ Roam Edge Reset Complete!"
echo "=========================================="
echo ""
echo "Your Raspberry Pi has been restored to normal state:"
echo "  - Edge service removed"
echo "  - WiFi hotspot deleted"
echo "  - Firewall rules reset"
echo "  - IP forwarding disabled"
echo "  - wlan0 available for normal WiFi connections"
echo ""
