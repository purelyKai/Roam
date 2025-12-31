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
import TopBar from "@/components/TopBar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Checkout } from "@/utils/stripeCheckout";
import * as Linking from "expo-linking";

const STORAGE_KEY = "@roam_remaining_time";

export default function ActiveSessionScreen() {
  const [remainingTime, setRemainingTime] = useState(0);
  const [autoExtend, setAutoExtend] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    // Load saved time from storage
    const loadSavedTime = async () => {
      try {
        const savedTime = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedTime) {
          setRemainingTime(parseInt(savedTime));
        }
      } catch (error) {
        console.error("Error loading saved time:", error);
      }
    };
    loadSavedTime();

    // Start the timer
    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        const newTime = prev > 0 ? prev - 1 : 0;
        // Save the new time to storage
        AsyncStorage.setItem(STORAGE_KEY, String(newTime)).catch(
          (error: Error) => console.error("Error saving time:", error)
        );
        return newTime;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;
  // Calculate progress based on the maximum purchased time
  const maxTime = Math.max(90 * 60, remainingTime); // Use 90 minutes or current time, whichever is larger
  const progress = remainingTime / maxTime;

  const purchaseOptions = [
    { label: "30 min", price: "$0.50", minutes: 30, priceId: "price_30min" },
    { label: "60 min", price: "$1.00", minutes: 60, priceId: "price_60min" },
    { label: "90 min", price: "$1.50", minutes: 90, priceId: "price_90min" },
  ];

  const addTime = async (minutes: number) => {
    const additionalSeconds = minutes * 60;
    const newTime = remainingTime + additionalSeconds;
    setRemainingTime(newTime);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, String(newTime));
    } catch (error) {
      console.error("Error saving new time:", error);
    }
  };

  const handlePurchase = async (option: {
    minutes: number;
    priceId: string;
  }) => {
    if (isProcessingPayment) return;

    try {
      setIsProcessingPayment(true);
      await Checkout(option.priceId);
      // Time will be added when the webhook confirms the payment
      // and the app receives the success URL
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
      console.log(url);
      if (url.includes("checkout-success")) {
        const params = Linking.parse(url).queryParams as { minutes?: string };
        if (params.minutes) {
          const minutes = parseInt(params.minutes, 10);
          if (!isNaN(minutes)) {
            await addTime(minutes);
          }
        }
      }
    };

    // Listen for when the app opens from a URL
    Linking.addEventListener("url", ({ url }) => handleUrl(url));
  }, []);

  return (
    <View style={styles.container}>
      <TopBar hasActiveConnection={true} showBackButton={true} />
      <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.contentContainer}>
            {/* Header */}
            <Text style={styles.title}>☕ Starbucks Wi-Fi</Text>
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
            <Text style={styles.endTime}>Session ends at 2:04 PM</Text>

            {/* Info Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Keep your connection going</Text>
              {purchaseOptions.map((option) => (
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
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// 🎨 Styles
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
  purchaseButton: {
    marginTop: 20,
    backgroundColor: "#ff007f",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  purchaseText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
