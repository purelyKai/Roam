import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Progress from "react-native-progress";
import TopBar from '@/components/TopBar';

export default function ActiveSessionScreen() {
  const [remainingTime, setRemainingTime] = useState(5 * 60); // 5 minutes
  const [autoExtend, setAutoExtend] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;
  const progress = remainingTime / (5 * 60);

  const purchaseOptions = [
    { label: "30 min", price: "$0.50" },
    { label: "60 min", price: "$1.00" },
    { label: "90 min", price: "$1.50" },
  ];

  return (
    <View style={styles.container}>
      <TopBar hasActiveConnection={true} showBackButton={true} />
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
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
                  {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                </Text>
                <Text style={styles.subText}>remaining</Text>
              </View>
            </View>
            <Text style={styles.endTime}>Session ends at 2:04 PM</Text>

            {/* Info Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Keep your connection going</Text>
              {purchaseOptions.map((option) => (
                <TouchableOpacity key={option.label} style={styles.optionButton}>
                  <Text style={styles.optionText}>{option.label}</Text>
                  <Text style={styles.priceText}>{option.price}</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity style={styles.purchaseButton}>
                <Text style={styles.purchaseText}>Purchase More Time</Text>
              </TouchableOpacity>
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
