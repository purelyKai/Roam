package main

import (
	"log"
	"os/exec"
)

func allowDevice(mac string) error {
	cmd := exec.Command("sudo", "iptables", "-I", "FORWARD", "1",
		"-m", "mac", "--mac-source", mac, "-j", "ACCEPT")

	if err := cmd.Run(); err != nil {
		return err
	}

	log.Printf("  → Added iptables rule for %s", mac)
	return nil
}

func blockDevice(mac string) error {
	cmd := exec.Command("sudo", "iptables", "-D", "FORWARD",
		"-m", "mac", "--mac-source", mac, "-j", "ACCEPT")

	if err := cmd.Run(); err != nil {
		// Don't return error if rule doesn't exist
		return nil
	}

	log.Printf("  → Removed iptables rule for %s", mac)
	return nil
}

func isDeviceAllowed(mac string) bool {
	cmd := exec.Command("sudo", "iptables", "-C", "FORWARD",
		"-m", "mac", "--mac-source", mac, "-j", "ACCEPT")

	return cmd.Run() == nil
}
