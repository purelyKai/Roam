/**
 * Stripe Payment - Native payment sheet integration
 *
 * Uses Stripe React Native SDK for native Apple Pay, Google Pay, and card payments.
 * Note: This won't work in Expo Go - requires a development build (npx expo prebuild).
 */

import {
  initPaymentSheet,
  presentPaymentSheet,
} from "@stripe/stripe-react-native";
import { BACKEND_URL, MOCK_MODE } from "../constants";
import { getDeviceId } from "./captivePortal";

/**
 * Response from the create-intent endpoint.
 */
export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amountCents: number;
  durationMinutes: number;
  hotspotId: string;
  hotspotName: string;
}

/**
 * Duration options for WiFi access.
 */
export const DURATION_OPTIONS = [
  { minutes: 30, label: "30 min" },
  { minutes: 60, label: "1 hour" },
  { minutes: 90, label: "1.5 hours" },
  { minutes: 120, label: "2 hours" },
];

/**
 * Creates a Payment Intent on the backend.
 *
 * @param hotspotId The hotspot ID to purchase access for
 * @param durationMinutes Duration of WiFi access
 * @returns Payment Intent response with client secret
 */
export async function createPaymentIntent(
  hotspotId: number,
  durationMinutes: number
): Promise<PaymentIntentResponse> {
  const customerDeviceId = await getDeviceId();

  const response = await fetch(`${BACKEND_URL}/api/payments/create-intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      hotspotId,
      durationMinutes,
      customerDeviceId,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Payment failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Format price from cents to dollars string.
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Calculate price for a hotspot and duration.
 */
export function calculatePrice(
  pricePerMinuteCents: number,
  minutes: number
): number {
  return pricePerMinuteCents * minutes;
}

/**
 * Process payment - handles both mock mode and real Stripe payments.
 *
 * In MOCK_MODE: Bypasses payment entirely for Expo Go development
 * In production: Uses Stripe SDK with native payment sheet
 *
 * @param hotspotId Hotspot ID
 * @param durationMinutes Duration
 * @param hotspotName Name for payment sheet description
 * @returns Payment Intent ID on success
 */
export async function processPayment(
  hotspotId: number,
  durationMinutes: number,
  hotspotName: string
): Promise<string> {
  // Mock mode - skip payment entirely for Expo Go development
  if (MOCK_MODE) {
    console.log("🧪 MOCK_MODE: Skipping payment, simulating success");
    return `mock_pi_${Date.now()}`;
  }

  // 1. Create Payment Intent
  const { clientSecret, paymentIntentId } = await createPaymentIntent(
    hotspotId,
    durationMinutes
  );

  // 2. Initialize Payment Sheet
  const { error: initError } = await initPaymentSheet({
    paymentIntentClientSecret: clientSecret,
    merchantDisplayName: "Roam WiFi",
    // Enable Apple Pay and Google Pay
    applePay: {
      merchantCountryCode: "US",
    },
    googlePay: {
      merchantCountryCode: "US",
      testEnv: __DEV__,
    },
    // Default billing details collection
    defaultBillingDetails: {
      name: "WiFi Customer",
    },
  });

  if (initError) {
    throw new Error(`Payment setup failed: ${initError.message}`);
  }

  // 3. Present Payment Sheet
  const { error: presentError } = await presentPaymentSheet();

  if (presentError) {
    if (presentError.code === "Canceled") {
      throw new Error("Payment canceled");
    }
    throw new Error(`Payment failed: ${presentError.message}`);
  }

  // 4. Payment successful - return payment intent ID
  return paymentIntentId;
}
