/**
 * Stripe Payment - Native payment sheet integration
 *
 * Uses Stripe React Native SDK for native Apple Pay, Google Pay, and card payments.
 * Requires @stripe/stripe-react-native to be installed:
 *   npx expo install @stripe/stripe-react-native
 *
 * Note: This won't work in Expo Go - requires a development build (npx expo prebuild).
 */

import { BACKEND_URL } from "../constants";
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

// ============================================
// Stripe React Native SDK Integration
// ============================================
// The following code requires @stripe/stripe-react-native
// Uncomment after installing the package:
//
// import {
//   initPaymentSheet,
//   presentPaymentSheet,
//   StripeProvider,
// } from "@stripe/stripe-react-native";
//
// /**
//  * Initialize and present the Stripe payment sheet.
//  *
//  * @param hotspotId Hotspot ID
//  * @param durationMinutes Duration
//  * @param hotspotName Name for payment sheet description
//  * @returns Payment Intent ID on success
//  */
// export async function processPayment(
//   hotspotId: number,
//   durationMinutes: number,
//   hotspotName: string
// ): Promise<string> {
//   // 1. Create Payment Intent
//   const { clientSecret, paymentIntentId, amountCents } =
//     await createPaymentIntent(hotspotId, durationMinutes);
//
//   // 2. Initialize Payment Sheet
//   const { error: initError } = await initPaymentSheet({
//     paymentIntentClientSecret: clientSecret,
//     merchantDisplayName: "Roam WiFi",
//     // Enable Apple Pay and Google Pay
//     applePay: {
//       merchantCountryCode: "US",
//     },
//     googlePay: {
//       merchantCountryCode: "US",
//       testEnv: __DEV__,
//     },
//     // Default billing details collection
//     defaultBillingDetails: {
//       name: "WiFi Customer",
//     },
//   });
//
//   if (initError) {
//     throw new Error(`Payment setup failed: ${initError.message}`);
//   }
//
//   // 3. Present Payment Sheet
//   const { error: presentError } = await presentPaymentSheet();
//
//   if (presentError) {
//     if (presentError.code === "Canceled") {
//       throw new Error("Payment canceled");
//     }
//     throw new Error(`Payment failed: ${presentError.message}`);
//   }
//
//   // 4. Payment successful - return payment intent ID
//   return paymentIntentId;
// }

/**
 * Placeholder processPayment for development without Stripe SDK.
 * Returns a mock payment intent ID.
 *
 * Replace this with the real implementation above when Stripe SDK is installed.
 */
export async function processPayment(
  hotspotId: number,
  durationMinutes: number,
  _hotspotName: string
): Promise<string> {
  // Create the payment intent to get real pricing/intent ID
  const { paymentIntentId } = await createPaymentIntent(
    hotspotId,
    durationMinutes
  );

  // In development without Stripe SDK, we simulate payment success
  // The webhook won't fire, so we'll need to manually confirm
  console.warn(
    "⚠️ Stripe SDK not installed - payment simulation mode. " +
      "Install @stripe/stripe-react-native for real payments."
  );

  // Return the payment intent ID
  // In production, this would be returned after successful payment sheet
  return paymentIntentId;
}
