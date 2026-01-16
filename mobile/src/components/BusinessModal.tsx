/**
 * Business Modal - Displays hotspot details and handles payment/connection flow
 *
 * Flow:
 * 1. User selects a hotspot on the map
 * 2. User taps "Connect" button
 * 3. Payment is processed via Stripe Payment Intent
 * 4. On successful payment, session is created (via webhook)
 * 5. App connects to WiFi network
 * 6. App authenticates with captive portal
 * 7. User has internet access for paid duration
 */

import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { connect } from "@/src/store/slices/connectionSlice";
import { Hotspot, formatHotspotPrice } from "@/src/hooks/useHotspots";
import {
  processPayment,
  DURATION_OPTIONS,
  createSession,
  connectToWifi,
  authenticateWithCaptivePortal,
} from "@/src/utils";

interface BusinessModalProps {
  hotspot: Hotspot | null;
  onClose: () => void;
}

type ConnectionStep = "idle" | "payment" | "session" | "wifi" | "auth" | "done";

const BusinessModal = ({ hotspot, onClose }: BusinessModalProps) => {
  const dispatch = useAppDispatch();
  const isActive = useAppSelector((state) => state.connection.isActive);
  const [step, setStep] = useState<ConnectionStep>("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const durationOption = DURATION_OPTIONS[0]; // 30 minutes default
  const businessName = hotspot?.name || "Untitled";
  const businessIcon =
    hotspot?.iconUrl ||
    Image.resolveAssetSource(require("@/src/assets/images/placeholder.jpg"))
      .uri;

  const priceDisplay = hotspot
    ? formatHotspotPrice(hotspot.pricePerMinuteCents, durationOption.minutes)
    : "$0.00";

  /**
   * Complete connection after payment success
   */
  const completeConnection = useCallback(
    async (minutes: number, paymentIntentId: string) => {
      if (!hotspot) return;

      try {
        // Create session with backend
        setStep("session");
        setStatusMessage("Creating session...");

        const session = await createSession(
          hotspot.id,
          minutes,
          paymentIntentId
        );

        // Update Redux state
        dispatch(
          connect({
            hotspot,
            sessionToken: session.sessionToken,
            expiresAt: session.expiresAt,
            durationMinutes: session.durationMinutes,
            paymentIntentId,
          })
        );

        // Connect to WiFi
        setStep("wifi");
        setStatusMessage("Connecting to WiFi...");

        const wifiResult = await connectToWifi(hotspot.ssid, hotspot.password);

        if (wifiResult.requiresManualConnection) {
          // Can't auto-connect (Expo Go), show credentials
          Alert.alert(
            "Connect to WiFi",
            `Please manually connect to:\n\nNetwork: ${
              hotspot.ssid
            }\nPassword: ${
              hotspot.password || "(no password)"
            }\n\nTap OK once connected.`,
            [
              {
                text: "OK",
                onPress: async () => {
                  setStep("auth");
                  setStatusMessage("Authenticating...");

                  const authResult = await authenticateWithCaptivePortal(
                    session.sessionToken
                  );

                  setStep("done");
                  if (authResult.success) {
                    Alert.alert(
                      "Connected!",
                      `Enjoy ${minutes} minutes of WiFi!`,
                      [{ text: "OK", onPress: onClose }]
                    );
                  } else {
                    Alert.alert(
                      "Session Ready",
                      `Session active. If issues persist, try opening a browser.\n\nExpires in ${minutes} min.`,
                      [{ text: "OK", onPress: onClose }]
                    );
                  }
                },
              },
            ]
          );
          return;
        }

        // Authenticate with captive portal
        setStep("auth");
        setStatusMessage("Authenticating...");

        const authResult = await authenticateWithCaptivePortal(
          session.sessionToken
        );

        setStep("done");

        if (authResult.success) {
          Alert.alert("Connected!", `Enjoy ${minutes} minutes of WiFi!`, [
            { text: "OK", onPress: onClose },
          ]);
        } else {
          Alert.alert(
            "Connection Issue",
            `Connected but auth may have failed. Try opening a browser.\n\nNetwork: ${hotspot.ssid}`,
            [{ text: "OK", onPress: onClose }]
          );
        }
      } catch (error) {
        console.error("Connection error:", error);
        setStep("idle");
        setStatusMessage(null);
        Alert.alert(
          "Connection Error",
          error instanceof Error
            ? error.message
            : "Failed to connect. Please try again."
        );
      }
    },
    [hotspot, dispatch, onClose]
  );

  /**
   * Handle connect button - initiates payment
   */
  const handleConnect = async () => {
    if (!hotspot || step !== "idle") return;

    try {
      setStep("payment");
      setStatusMessage("Processing payment...");

      // Process payment using native Stripe SDK (or fallback)
      const paymentIntentId = await processPayment(
        hotspot.id,
        durationOption.minutes,
        hotspot.name
      );

      // Payment successful - complete connection
      await completeConnection(durationOption.minutes, paymentIntentId);
    } catch (error) {
      console.error("Payment error:", error);
      setStep("idle");
      setStatusMessage(null);

      const message =
        error instanceof Error ? error.message : "Failed to process payment.";

      if (message !== "Payment canceled") {
        Alert.alert("Payment Error", message);
      }
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!hotspot) {
      setStep("idle");
      setStatusMessage(null);
    }
  }, [hotspot]);

  const isProcessing = step !== "idle" && step !== "done";

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={hotspot !== null}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>

          <View style={styles.businessHeader}>
            <Image source={{ uri: businessIcon }} style={styles.businessIcon} />
            <Text style={styles.businessName}>{businessName}</Text>
            {hotspot && !hotspot.isOnline && (
              <Text style={styles.offlineIndicator}>Offline</Text>
            )}
          </View>

          {isActive ? (
            <View style={styles.messageContainer}>
              <Text style={styles.messageTitle}>Already Connected</Text>
              <Text style={styles.messageText}>
                You're currently connected to another network. Disconnect first
                to connect here.
              </Text>
            </View>
          ) : (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.connectButton,
                  isProcessing && styles.disabledButton,
                  hotspot && !hotspot.isOnline && styles.offlineButton,
                ]}
                onPress={handleConnect}
                disabled={isProcessing || !!(hotspot && !hotspot.isOnline)}
              >
                <Text style={styles.buttonPrice}>{priceDisplay}</Text>
                <Text style={styles.buttonDuration}>
                  {durationOption.label}
                </Text>
                <Text style={styles.buttonLabel}>WiFi</Text>
              </TouchableOpacity>

              {statusMessage && (
                <Text style={styles.statusText}>{statusMessage}</Text>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    width: "90%",
    maxHeight: "80%",
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  closeButton: {
    position: "absolute",
    right: 15,
    top: 15,
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 28,
    color: "#333",
  },
  businessHeader: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 40,
  },
  businessIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  businessName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  offlineIndicator: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    fontStyle: "italic",
  },
  buttonContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  connectButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#E20074",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  disabledButton: {
    opacity: 0.5,
  },
  offlineButton: {
    backgroundColor: "#999",
  },
  buttonPrice: {
    color: "white",
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 8,
  },
  buttonDuration: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
  },
  buttonLabel: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
  },
  statusText: {
    marginTop: 16,
    fontSize: 16,
    color: "#E20074",
    fontWeight: "500",
  },
  messageContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  messageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#E20074",
    marginBottom: 12,
  },
  messageText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
});

export default BusinessModal;
