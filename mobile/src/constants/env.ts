/**
 * Environment variables
 * Centralized access to all environment variables with validation
 */

function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value || typeof value !== "string" || !value.trim()) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value.trim();
}

// Backend API URL
export const BACKEND_URL = getEnvVar("EXPO_PUBLIC_BACKEND_URL").replace(
  /\/+$/,
  ""
);

/**
 * Mock mode for development in Expo Go.
 * When true, bypasses native modules (Stripe SDK, WiFi) that don't work in Expo Go.
 * Set to false for production builds.
 */
export const MOCK_MODE = __DEV__ && true; // Change to false when testing with dev build
