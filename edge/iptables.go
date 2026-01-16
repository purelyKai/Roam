package main

import (
	"log"
	"os/exec"
)

// ============================================
// IP-based iptables rules for captive portal
// ============================================

// allowIPAccess grants internet access to a specific IP address
func allowIPAccess(ip string) error {
	// Allow forwarding for this IP
	cmdForward := exec.Command("sudo", "iptables", "-I", "FORWARD", "1",
		"-s", ip, "-j", "ACCEPT")
	if err := cmdForward.Run(); err != nil {
		log.Printf("❌ Failed to add FORWARD rule for %s: %v", ip, err)
		return err
	}

	// Bypass captive portal redirect for this IP (allow normal traffic)
	cmdNat := exec.Command("sudo", "iptables", "-t", "nat", "-I", "PREROUTING", "1",
		"-s", ip, "-j", "ACCEPT")
	if err := cmdNat.Run(); err != nil {
		log.Printf("❌ Failed to add NAT bypass rule for %s: %v", ip, err)
		// Rollback the FORWARD rule
		exec.Command("sudo", "iptables", "-D", "FORWARD", "-s", ip, "-j", "ACCEPT").Run()
		return err
	}

	log.Printf("  → Granted internet access to IP %s", ip)
	return nil
}

// revokeIPAccess removes internet access for a specific IP address
func revokeIPAccess(ip string) error {
	// Remove forwarding rule
	exec.Command("sudo", "iptables", "-D", "FORWARD", "-s", ip, "-j", "ACCEPT").Run()

	// Remove NAT bypass rule
	exec.Command("sudo", "iptables", "-t", "nat", "-D", "PREROUTING", "-s", ip, "-j", "ACCEPT").Run()

	log.Printf("  → Revoked internet access from IP %s", ip)
	return nil
}

// isIPAllowed checks if an IP address has internet access
func isIPAllowed(ip string) bool {
	cmd := exec.Command("sudo", "iptables", "-C", "FORWARD", "-s", ip, "-j", "ACCEPT")
	return cmd.Run() == nil
}

// ============================================
// Captive portal iptables setup
// ============================================

// SetupCaptivePortalRules sets up the initial iptables rules for the captive portal
// This should be called on startup to configure traffic interception
func SetupCaptivePortalRules(gatewayIP string, portalPort string) error {
	log.Println("🔧 Setting up captive portal iptables rules...")

	// Set default FORWARD policy to DROP (block all by default)
	if err := exec.Command("sudo", "iptables", "-P", "FORWARD", "DROP").Run(); err != nil {
		log.Printf("⚠️ Failed to set FORWARD policy: %v", err)
	}

	// Allow established connections
	exec.Command("sudo", "iptables", "-A", "FORWARD",
		"-i", "eth0", "-o", "wlan0",
		"-m", "state", "--state", "RELATED,ESTABLISHED",
		"-j", "ACCEPT").Run()

	// Redirect HTTP traffic to captive portal
	exec.Command("sudo", "iptables", "-t", "nat", "-A", "PREROUTING",
		"-i", "wlan0", "-p", "tcp", "--dport", "80",
		"-j", "DNAT", "--to-destination", gatewayIP+":"+portalPort).Run()

	// Redirect DNS to local DNS server (for captive portal detection)
	exec.Command("sudo", "iptables", "-t", "nat", "-A", "PREROUTING",
		"-i", "wlan0", "-p", "udp", "--dport", "53",
		"-j", "DNAT", "--to-destination", gatewayIP+":53").Run()

	// Allow traffic from the edge device itself
	exec.Command("sudo", "iptables", "-A", "INPUT",
		"-i", "wlan0", "-p", "tcp", "--dport", portalPort,
		"-j", "ACCEPT").Run()

	// Enable IP forwarding
	exec.Command("sudo", "sysctl", "-w", "net.ipv4.ip_forward=1").Run()

	log.Println("✅ Captive portal iptables rules configured")
	return nil
}

// CleanupCaptivePortalRules removes the captive portal iptables rules
// Call this on shutdown for clean exit
func CleanupCaptivePortalRules(gatewayIP string, portalPort string) error {
	log.Println("🧹 Cleaning up captive portal iptables rules...")

	// Remove HTTP redirect
	exec.Command("sudo", "iptables", "-t", "nat", "-D", "PREROUTING",
		"-i", "wlan0", "-p", "tcp", "--dport", "80",
		"-j", "DNAT", "--to-destination", gatewayIP+":"+portalPort).Run()

	// Remove DNS redirect
	exec.Command("sudo", "iptables", "-t", "nat", "-D", "PREROUTING",
		"-i", "wlan0", "-p", "udp", "--dport", "53",
		"-j", "DNAT", "--to-destination", gatewayIP+":53").Run()

	// Reset FORWARD policy to ACCEPT
	exec.Command("sudo", "iptables", "-P", "FORWARD", "ACCEPT").Run()

	log.Println("✅ Captive portal iptables rules cleaned up")
	return nil
}
