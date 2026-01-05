import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { useState, useEffect } from "react";
import * as Linking from "expo-linking";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { connect } from "@/src/store/slices/connectionSlice";
import { Pin } from "@/src/hooks/getPins";
import {
  Checkout,
  MOCK_PAYMENTS,
  DEFAULT_PRICE_OPTION,
} from "@/src/utils/stripeCheckout";

interface BusinessModalProps {
  pin: Pin | null;
  onClose: () => void;
}

const BusinessModal = ({ pin, onClose }: BusinessModalProps) => {
  const dispatch = useAppDispatch();
  const isActive = useAppSelector((state) => state.connection.isActive);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const businessName = pin?.name || "Untitled";
  const businessIcon =
    pin?.iconUrl ||
    Image.resolveAssetSource(require("@/src/assets/images/placeholder.jpg"))
      .uri;

  const handleCheckout = async () => {
    if (!pin) {
      Alert.alert("Error", "No business selected");
      return;
    }

    if (isProcessingPayment) return;

    try {
      setIsProcessingPayment(true);

      if (MOCK_PAYMENTS) {
        // Mock successful payment - skip Stripe
        dispatch(connect({ pin, duration: DEFAULT_PRICE_OPTION.minutes }));
        Alert.alert(
          "Connected!",
          `You're now connected to ${businessName} for ${DEFAULT_PRICE_OPTION.minutes} minutes.`
        );
        setIsProcessingPayment(false);
        onClose();
        return;
      }

      await Checkout(DEFAULT_PRICE_OPTION.priceId, 1);
    } catch (error) {
      console.error("Checkout error:", error);
      Alert.alert("Error", "Failed to process payment. Please try again.");
      setIsProcessingPayment(false);
    }
  };

  // Handle URL when app opens from Stripe redirect
  useEffect(() => {
    const handleUrl = async (url: string) => {
      if (url.includes("checkout-success") && pin) {
        const params = Linking.parse(url).queryParams as { minutes?: string };
        if (params.minutes) {
          const minutes = parseInt(params.minutes, 10);
          if (!isNaN(minutes)) {
            dispatch(connect({ pin, duration: minutes }));
            Alert.alert(
              "Connected!",
              `You're now connected to ${businessName} for ${minutes} minutes.`
            );
            setIsProcessingPayment(false);
            onClose();
          }
        }
      }
    };

    const subscription = Linking.addEventListener("url", ({ url }) =>
      handleUrl(url)
    );

    return () => subscription.remove();
  }, [pin, businessName, dispatch, onClose]);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={pin !== null}
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

          {isActive ? (
            <View style={styles.alreadyConnectedContainer}>
              <Text style={styles.alreadyConnectedText}>Already Connected</Text>
              <Text style={styles.alreadyConnectedSubtext}>
                You're currently connected to another network. Disconnect first
                to connect here.
              </Text>
            </View>
          ) : (
            <View style={styles.circleButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.circleButton,
                  isProcessingPayment && styles.disabledButton,
                ]}
                onPress={handleCheckout}
                disabled={isProcessingPayment}
              >
                <Text style={styles.circleButtonPrice}>
                  {DEFAULT_PRICE_OPTION.price}
                </Text>
                <Text style={styles.circleButtonText}>
                  {DEFAULT_PRICE_OPTION.minutes} min
                </Text>
                <Text style={styles.circleButtonText}>WiFi</Text>
              </TouchableOpacity>
              {isProcessingPayment && (
                <Text style={styles.processingText}>Processing...</Text>
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
  disabledButton: {
    opacity: 0.5,
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
  processingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#888",
  },
  alreadyConnectedContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  alreadyConnectedText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#E20074",
    marginBottom: 12,
  },
  alreadyConnectedSubtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
});

export default BusinessModal;
