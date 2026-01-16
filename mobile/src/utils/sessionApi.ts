/**
 * Session API - Backend communication for WiFi session management
 */

import { BACKEND_URL } from "../constants";
import { getDeviceId } from "./captivePortal";

/**
 * Session response from backend
 */
export interface SessionResponse {
  sessionToken: string;
  ssid: string;
  password: string;
  durationMinutes: number;
  expiresAt: number;
  pinId: string; // Keeping for backend compatibility (hotspotId)
  deviceId: string;
}

/**
 * Create a new WiFi session after successful payment.
 * Called after payment webhook has been processed.
 *
 * @param hotspotId - The hotspot ID
 * @param durationMinutes - Session duration in minutes
 * @param paymentIntentId - Stripe Payment Intent ID
 * @returns Session details with token and WiFi credentials
 */
export async function createSession(
  hotspotId: number | string,
  durationMinutes: number,
  paymentIntentId?: string
): Promise<SessionResponse> {
  const deviceId = await getDeviceId();

  const response = await fetch(`${BACKEND_URL}/api/session/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: deviceId,
      pinId: hotspotId.toString(), // Backend still uses pinId
      durationMinutes,
      stripePaymentId: paymentIntentId,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.message || `Failed to create session: ${response.status}`
    );
  }

  return response.json();
}

/**
 * Validate if a session token is still valid.
 *
 * @param sessionToken - The session token to validate
 * @returns true if valid, false otherwise
 */
export async function validateSession(sessionToken: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/session/validate?token=${sessionToken}`
    );
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Extend an existing session by adding more time.
 *
 * @param sessionToken - The session token to extend
 * @param additionalMinutes - Minutes to add
 * @returns Updated session details
 */
export async function extendSession(
  sessionToken: string,
  additionalMinutes: number
): Promise<SessionResponse> {
  const response = await fetch(
    `${BACKEND_URL}/api/session/extend?token=${sessionToken}&minutes=${additionalMinutes}`,
    { method: "POST" }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.message || `Failed to extend session: ${response.status}`
    );
  }

  return response.json();
}

/**
 * Invalidate (end) a session.
 *
 * @param sessionToken - The session token to invalidate
 * @returns true if successful
 */
export async function invalidateSession(
  sessionToken: string
): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/session/${sessionToken}`, {
      method: "DELETE",
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get session details by token.
 *
 * @param sessionToken - The session token
 * @returns Session details or null if not found
 */
export async function getSession(
  sessionToken: string
): Promise<SessionResponse | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/session/${sessionToken}`);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}
