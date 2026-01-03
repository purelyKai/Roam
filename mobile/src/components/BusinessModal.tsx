import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import { useState } from "react";
import { Checkout } from "@/src/utils/stripeCheckout";

interface BusinessModalProps {
  businessName: string;
  businessIcon: string;
  visible: boolean;
  onClose: () => void;
}

const BusinessModal = ({
  businessName,
  businessIcon,
  visible,
  onClose,
}: BusinessModalProps) => {
  const handleCheckout = () => {
    console.log("Checking out for 30 minutes");
    Checkout("price_1SJlk86PfUH9aqsh1rZ8BhBY", 1);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
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
          </View>

          <View style={styles.circleButtonContainer}>
            <TouchableOpacity
              style={styles.circleButton}
              onPress={handleCheckout}
            >
              <Text style={styles.circleButtonPrice}>$0.50</Text>
              <Text style={styles.circleButtonText}>30 min</Text>
              <Text style={styles.circleButtonText}>WiFi</Text>
            </TouchableOpacity>
          </View>
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
  circleButtonContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  circleButton: {
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
  circleButtonPrice: {
    color: "white",
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 8,
  },
  circleButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
  },
});

export default BusinessModal;
