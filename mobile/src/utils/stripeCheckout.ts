import * as WebBrowser from "expo-web-browser";
import { Platform, Linking } from "react-native";

const API_BASE =
  Platform.OS === "android"
    ? "http://10.0.2.2:5835" // Android emulator -> host machine
    : "http://localhost:5835";

export async function Checkout(priceId: string, qty = 1): Promise<void> {
  if (!priceId) throw new Error("Missing priceId");
  const endpoint = `${API_BASE}/api/payments/create-checkout-session`;

  // Backend expects @RequestParam, so send form-encoded
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
    await WebBrowser.openAuthSessionAsync(url, "mobile://pages/ElapsedTime"); // todo - URI to detect browser returning to app
  } catch {
    await Linking.openURL(url);
  }
}

async function safeText(res: Response) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}
