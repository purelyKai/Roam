/**
 * Utils barrel export
 */

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
