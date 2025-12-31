package main

import (
	"os/exec"
	"strings"
)

func getConnectedDevices() []string {
	cmd := exec.Command("iw", "dev", "wlan0", "station", "dump")
	output, err := cmd.Output()
	if err != nil {
		return []string{}
	}

	var macs []string
	lines := strings.Split(string(output), "\n")

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "Station") {
			fields := strings.Fields(line)
			if len(fields) >= 2 {
				mac := strings.ToLower(fields[1])
				macs = append(macs, mac)
			}
		}
	}

	return macs
}

func getDeviceInfo(mac string) map[string]string {
	cmd := exec.Command("iw", "dev", "wlan0", "station", "get", mac)
	output, err := cmd.Output()
	if err != nil {
		return nil
	}

	info := make(map[string]string)
	lines := strings.Split(string(output), "\n")

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.Contains(line, ":") {
			parts := strings.SplitN(line, ":", 2)
			if len(parts) == 2 {
				key := strings.TrimSpace(parts[0])
				value := strings.TrimSpace(parts[1])
				info[key] = value
			}
		}
	}

	return info
}
