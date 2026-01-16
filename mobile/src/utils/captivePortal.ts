/**
 * Captive Portal Authentication
 *
 * Handles authentication with the edge device's captive portal
 * to grant internet access after payment.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getGatewayIP } from "./wifiManager";

const DEVICE_ID_KEY = "roam_device_id";

/**
 * Result from captive portal authentication
 */
export interface AuthResult {
  success: boolean;
  message: string;
}

/**
 * Get or create a persistent device ID for this mobile device.
 * Used to identify the device for session reconnection.
 */
export async function getDeviceId(): Promise<string> {
  let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    // Generate UUID v4
    deviceId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    console.log("🆔 Generated new device ID:", deviceId);
  }

  return deviceId;
}

/**
 * Authenticate with the edge device's captive portal.
 * This grants internet access for the session duration.
 *
 * @param sessionToken - The session token from backend
 * @returns Authentication result
 */
export async function authenticateWithCaptivePortal(
  sessionToken: string
): Promise<AuthResult> {
  try {
    const deviceId = await getDeviceId();
    const gatewayIP = getGatewayIP();
    const authUrl = `http://${gatewayIP}:2050/auth`;

    console.log("🔐 Authenticating with captive portal:", authUrl);

    const response = await fetch(authUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: sessionToken,
        deviceId: deviceId,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log("✅ Captive portal authentication successful");
      return { success: true, message: data.message || "Authenticated" };
    }

    console.log("❌ Captive portal authentication failed:", data.error);
    return { success: false, message: data.error || "Authentication failed" };
  } catch (error) {
    console.error("❌ Captive portal error:", error);

    // Network errors likely mean we're not on the WiFi yet
    const message =
      error instanceof Error ? error.message : "Connection failed";

    return {
      success: false,
      message: `Could not reach captive portal: ${message}`,
    };
  }
}

/**
 * Check if we're currently behind a captive portal (not authenticated).
 * Uses connectivity check endpoints to detect portal redirection.
 */
export async function isBehindCaptivePortal(): Promise<boolean> {
  try {
    // Try Android connectivity check endpoint
    const response = await fetch(
      "http://connectivitycheck.gstatic.com/generate_204",
      {
        method: "GET",
        redirect: "manual",
      }
    );

    // 204 = internet access, anything else = captive portal
    return response.status !== 204;
  } catch {
    // Network error - likely behind captive portal or no connection
    return true;
  }
}
