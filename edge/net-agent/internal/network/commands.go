package network

import (
    "fmt"
    "log"
)

// BlockDomain blocks traffic to/from a specific domain
func BlockDomain(domain string) error {
    log.Printf("🚫 Blocking domain: %s", domain)
    // TODO: Implement iptables/nftables rules
    // For now, just log
    return nil
}

// KickDevice disconnects a device from the network
func KickDevice(ipOrMAC string) error {
    log.Printf("👢 Kicking device: %s", ipOrMAC)
    // TODO: Implement using arp-scan + iptables
    return nil
}

// GetTopDevices returns the top N devices by bandwidth usage
func GetTopDevices(n int) ([]DeviceStats, error) {
    log.Printf("📊 Getting top %d devices...", n)
    
    // TODO: Implement using tcpdump/iftop/vnstat
    // For now, return mock data
    return []DeviceStats{
        {IP: "192.168.1.100", MAC: "aa:bb:cc:dd:ee:ff", Usage: "2.3 GB"},
        {IP: "192.168.1.101", MAC: "11:22:33:44:55:66", Usage: "1.1 GB"},
        {IP: "192.168.1.102", MAC: "aa:11:bb:22:cc:33", Usage: "850 MB"},
    }, nil
}

type DeviceStats struct {
    IP    string
    MAC   string
    Usage string
}

func (d DeviceStats) String() string {
    return fmt.Sprintf("%s (%s): %s", d.IP, d.MAC, d.Usage)
}