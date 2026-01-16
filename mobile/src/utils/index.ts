/**
 * Utils barrel export
 */

// Re-export MOCK_MODE for convenience
export { MOCK_MODE } from "../constants";

// Stripe payment
export {
  processPayment,
  createPaymentIntent,
  formatPrice,
  calculatePrice,
  DURATION_OPTIONS,
  type PaymentIntentResponse,
} from "./stripePayment";

// Session API
export {
  createSession,
  validateSession,
  extendSession,
  invalidateSession,
  getSession,
  type SessionResponse,
} from "./sessionApi";

// Captive Portal
export {
  getDeviceId,
  authenticateWithCaptivePortal,
  isBehindCaptivePortal,
} from "./captivePortal";

// WiFi Manager
export { connectToWifi, getCurrentSSID } from "./wifiManager";
