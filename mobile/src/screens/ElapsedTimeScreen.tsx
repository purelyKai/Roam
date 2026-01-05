import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Progress from "react-native-progress";
import * as Linking from "expo-linking";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
  extendConnection,
  disconnect,
} from "@/src/store/slices/connectionSlice";
import {
  Checkout,
  MOCK_PAYMENTS,
  PRICE_OPTIONS,
  PriceOption,
} from "@/src/utils/stripeCheckout";

export default function ElapsedTimeScreen() {
  const dispatch = useAppDispatch();
  const { isActive, connectedPin, expiryTime } = useAppSelector(
    (state) => state.connection
  );

  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate remaining time in seconds
  const remainingTime = expiryTime
    ? Math.max(0, Math.floor((expiryTime - currentTime) / 1000))
    : 0;

  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;

  // Auto-disconnect when time expires
  useEffect(() => {
    if (isActive && remainingTime === 0) {
      dispatch(disconnect());
      Alert.alert("Session Expired", "Your connection has ended.");
    }
  }, [isActive, remainingTime, dispatch]);

  // Calculate progress (assuming max 90 minutes)
  const maxTime = 90 * 60; // 90 minutes in seconds
  const progress = Math.min(remainingTime / maxTime, 1);

  // Calculate session end time
  const endTime = expiryTime
    ? new Date(expiryTime).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    : "--:--";

  const handlePurchase = async (option: PriceOption) => {
    if (isProcessingPayment) return;

    try {
      setIsProcessingPayment(true);

      if (MOCK_PAYMENTS) {
        // Mock successful payment - skip Stripe
        dispatch(extendConnection({ additionalDuration: option.minutes }));
        Alert.alert(
          "Success",
          `Added ${option.minutes} minutes to your session!`
        );
        setIsProcessingPayment(false);
        return;
      }

      await Checkout(option.priceId);
    } catch (error) {
      console.error("Payment error:", error);
      Alert.alert("Error", "Failed to process payment. Please try again.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Handle URL when app opens from Stripe redirect
  useEffect(() => {
    const handleUrl = async (url: string) => {
      if (url.includes("checkout-success")) {
        const params = Linking.parse(url).queryParams as { minutes?: string };
        if (params.minutes) {
          const minutes = parseInt(params.minutes, 10);
          if (!isNaN(minutes) && isActive) {
            dispatch(extendConnection({ additionalDuration: minutes }));
            Alert.alert("Success", `Added ${minutes} minutes to your session!`);
          }
        }
      }
    };

    const subscription = Linking.addEventListener("url", ({ url }) =>
      handleUrl(url)
    );

    return () => subscription.remove();
  }, [isActive, dispatch]);

  // Show message if not connected
  if (!isActive || !connectedPin) {
    return (
      <View style={styles.container}>
        <SafeAreaView
          style={styles.safeArea}
          edges={["bottom", "left", "right"]}
        >
          <View style={styles.notConnectedContainer}>
            <Text style={styles.notConnectedText}>Not connected</Text>
            <Text style={styles.notConnectedSubtext}>
              Connect to a WiFi network from the Home screen
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.contentContainer}>
            {/* Header */}
            <Text style={styles.title}>
              {connectedPin.name || "WiFi Connection"}
            </Text>
            <Text style={styles.status}>✅ Connected — Secure session</Text>

            {/* Timer */}
            <View style={styles.timerContainer}>
              <Progress.Circle
                size={180}
                progress={progress}
                color="#ff007f"
                unfilledColor="#ffe6f0"
                borderWidth={0}
                thickness={10}
                showsText={false}
              />
              <View style={styles.timerTextContainer}>
                <Text style={styles.timeText}>
                  {String(minutes).padStart(2, "0")}:
                  {String(seconds).padStart(2, "0")}
                </Text>
                <Text style={styles.subText}>remaining</Text>
              </View>
            </View>
            <Text style={styles.endTime}>Session ends at {endTime}</Text>

            {/* Info Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Keep your connection going</Text>
              {PRICE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.label}
                  style={[
                    styles.optionButton,
                    isProcessingPayment && styles.disabledButton,
                  ]}
                  onPress={() => handlePurchase(option)}
                  disabled={isProcessingPayment}
                >
                  <Text style={styles.optionText}>{option.label}</Text>
                  <Text style={styles.priceText}>{option.price}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Disconnect Button */}
            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={() => {
                Alert.alert(
                  "Disconnect",
                  "Are you sure you want to end your session?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Disconnect",
                      style: "destructive",
                      onPress: () => dispatch(disconnect()),
                    },
                  ]
                );
              }}
            >
              <Text style={styles.disconnectText}>End Session</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff5fa",
  },
  disabledButton: {
    opacity: 0.5,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  notConnectedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  notConnectedText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  notConnectedSubtext: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ff007f",
  },
  status: {
    marginTop: 4,
    color: "#777",
  },
  timerContainer: {
    marginTop: 40,
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  timerTextContainer: {
    position: "absolute",
    alignItems: "center",
  },
  timeText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#333",
  },
  subText: {
    fontSize: 14,
    color: "#888",
  },
  endTime: {
    fontSize: 14,
    color: "#888",
    marginBottom: 20,
  },
  card: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  optionButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff0f6",
    borderColor: "#ff007f",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginVertical: 5,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  priceText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ff007f",
  },
  disconnectButton: {
    marginTop: 20,
    backgroundColor: "#fff",
    borderColor: "#ff007f",
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  disconnectText: {
    color: "#ff007f",
    fontSize: 16,
    fontWeight: "600",
  },
});
