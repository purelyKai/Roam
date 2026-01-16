/**
 * WiFi Manager - Handles WiFi connections using react-native-wifi-reborn
 *
 * NOTE: react-native-wifi-reborn requires native modules and will NOT work in Expo Go.
 * For development in Expo Go, WiFi connection will fail gracefully and prompt
 * the user to manually connect to the WiFi network.
 *
 * For production builds (expo prebuild / EAS Build), the native modules will work.
 */

// Default gateway IP for edge devices
const DEFAULT_GATEWAY_IP = "192.168.4.1";

/**
 * Result of a WiFi connection attempt
 */
export interface WifiConnectionResult {
  success: boolean;
  message: string;
  requiresManualConnection?: boolean;
}

/**
 * Check if native WiFi module is available
 * Returns false in Expo Go since native modules aren't supported
 */
async function isWifiModuleAvailable(): Promise<boolean> {
  try {
    // Dynamic import to avoid crashes when module isn't available
    const WifiManager = await import("react-native-wifi-reborn");
    return WifiManager !== null;
  } catch {
    return false;
  }
}

/**
 * Connect to a WiFi network programmatically
 *
 * @param ssid - Network SSID
 * @param password - Network password
 * @returns Connection result
 */
export async function connectToWifi(
  ssid: string,
  password?: string | null
): Promise<WifiConnectionResult> {
  try {
    const moduleAvailable = await isWifiModuleAvailable();

    if (!moduleAvailable) {
      console.log("📶 WiFi module not available (likely running in Expo Go)");
      return {
        success: false,
        message: "WiFi module not available. Please connect manually.",
        requiresManualConnection: true,
      };
    }

    // Dynamic import for react-native-wifi-reborn
    const WifiManager = await import("react-native-wifi-reborn");

    console.log(`📶 Attempting to connect to WiFi: ${ssid}`);

    // Connect to protected WiFi network
    // isWep = false (we use WPA/WPA2), isHidden = false
    await WifiManager.default.connectToProtectedSSID(
      ssid,
      password ?? null,
      false,
      false
    );

    // Wait for connection to establish
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Verify connection
    const currentSSID = await WifiManager.default.getCurrentWifiSSID();

    if (currentSSID === ssid) {
      console.log(`✅ Connected to WiFi: ${ssid}`);
      return {
        success: true,
        message: `Connected to ${ssid}`,
      };
    }

    return {
      success: false,
      message: `Connected but SSID mismatch. Expected: ${ssid}, Got: ${currentSSID}`,
    };
  } catch (error) {
    console.error("❌ WiFi connection error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Check for common errors
    if (errorMessage.includes("not available")) {
      return {
        success: false,
        message: "WiFi module not available. Please connect manually.",
        requiresManualConnection: true,
      };
    }

    return {
      success: false,
      message: `Failed to connect: ${errorMessage}`,
      requiresManualConnection: true,
    };
  }
}

/**
 * Get the current WiFi SSID
 *
 * @returns Current SSID or null if not connected
 */
export async function getCurrentSSID(): Promise<string | null> {
  try {
    const moduleAvailable = await isWifiModuleAvailable();
    if (!moduleAvailable) return null;

    const WifiManager = await import("react-native-wifi-reborn");
    return await WifiManager.default.getCurrentWifiSSID();
  } catch {
    return null;
  }
}

/**
 * Check if currently connected to a specific SSID
 *
 * @param expectedSSID - The SSID to check for
 * @returns true if connected to the expected SSID
 */
export async function isConnectedToSSID(
  expectedSSID: string
): Promise<boolean> {
  const currentSSID = await getCurrentSSID();
  return currentSSID === expectedSSID;
}

/**
 * Disconnect from current WiFi network
 */
export async function disconnectFromWifi(): Promise<void> {
  try {
    const moduleAvailable = await isWifiModuleAvailable();
    if (!moduleAvailable) return;

    const WifiManager = await import("react-native-wifi-reborn");
    await WifiManager.default.disconnect();
    console.log("📶 Disconnected from WiFi");
  } catch (error) {
    console.error("Failed to disconnect:", error);
  }
}

/**
 * Get the gateway IP address (edge device IP)
 * Falls back to default if unable to determine
 */
export function getGatewayIP(): string {
  // For now, we use a fixed gateway IP
  // In production, this could be determined dynamically
  return DEFAULT_GATEWAY_IP;
}
