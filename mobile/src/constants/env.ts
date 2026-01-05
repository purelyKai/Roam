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
