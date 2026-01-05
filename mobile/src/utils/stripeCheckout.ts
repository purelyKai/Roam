import * as WebBrowser from "expo-web-browser";
import { Linking } from "react-native";
import { BACKEND_URL } from "../constants";

// Set to true in development to bypass Stripe checkout
export const MOCK_PAYMENTS = __DEV__;

// Price options available for purchase
export const PRICE_OPTIONS = [
  {
    label: "30 min",
    price: "$0.50",
    minutes: 30,
    priceId: "price_1SJlk86PfUH9aqsh1rZ8BhBY",
  },
  {
    label: "60 min",
    price: "$1.00",
    minutes: 60,
    priceId: "price_60min",
  },
  {
    label: "90 min",
    price: "$1.50",
    minutes: 90,
    priceId: "price_90min",
  },
] as const;

export type PriceOption = (typeof PRICE_OPTIONS)[number];

// Default option for initial purchases
export const DEFAULT_PRICE_OPTION = PRICE_OPTIONS[0];

/**
 * Initiates Stripe checkout session
 * In dev mode with MOCK_PAYMENTS=true, this will throw to indicate mock should be used
 */
export async function Checkout(priceId: string, qty = 1): Promise<void> {
  if (!priceId) throw new Error("Missing priceId");

  const endpoint = `${BACKEND_URL}/api/payments/create-checkout-session`;
  const body = new URLSearchParams({ priceId, qty: String(qty) });

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const msg = await safeText(res);
    throw new Error(
      `Checkout session failed (${res.status}): ${msg || "Unknown error"}`
    );
  }

  const url = (await res.text()).trim();

  try {
    await WebBrowser.openAuthSessionAsync(url, "roam://pages/ElapsedTime");
  } catch {
    await Linking.openURL(url);
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}
