package main

import (
    "os"
)

type Config struct {
    BackendURL string
    PiDeviceID string
    PiSecret   string
}

func LoadConfig() *Config {
    return &Config{
        BackendURL: getEnv("BACKEND_URL", "https://api.roam.com"),
        PiDeviceID: getEnv("PI_DEVICE_ID", "pi_unknown"),
        PiSecret:   getEnv("PI_SECRET", "change_me"),
    }
}

func getEnv(key, defaultVal string) string {
    if val := os.Getenv(key); val != "" {
        return val
    }
    return defaultVal
}
