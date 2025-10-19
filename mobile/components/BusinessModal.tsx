import { View, Text, Image, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useState } from 'react';

interface BusinessModalProps {
  businessName: string;
  businessIcon: string;
  visible: boolean;
  onClose: () => void;
}

const BusinessModal = ({ businessName, businessIcon, visible, onClose }: BusinessModalProps) => {
  const [selectedTime, setSelectedTime] = useState(30); // Default 30 minutes

  const timeOptions = [
    { minutes: 30, price: 0.50 },
    { minutes: 60, price: 1.00 },
    { minutes: 90, price: 1.50 },
    { minutes: 120, price: 2.00 },
  ];

  const handleCheckout = () => {
    // TODO: Implement checkout logic
    console.log(`Checking out for ${selectedTime} minutes`);
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
            <Image
              source={{ uri: businessIcon }}
              style={styles.businessIcon}
            />
            <Text style={styles.businessName}>{businessName}</Text>
          </View>

          <Text style={styles.sectionTitle}>Select WiFi Duration</Text>
          
          <ScrollView style={styles.timeOptionsContainer}>
            {timeOptions.map((option) => (
              <TouchableOpacity
                key={option.minutes}
                style={[
                  styles.timeOption,
                  selectedTime === option.minutes && styles.selectedTimeOption
                ]}
                onPress={() => setSelectedTime(option.minutes)}
              >
                <Text style={[
                  styles.timeOptionText,
                  selectedTime === option.minutes && styles.selectedTimeOptionText
                ]}>
                  {option.minutes} minutes
                </Text>
                <Text style={[
                  styles.priceText,
                  selectedTime === option.minutes && styles.selectedTimeOptionText
                ]}>
                  ${option.price.toFixed(2)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={handleCheckout}
          >
            <Text style={styles.checkoutButtonText}>
              Checkout - ${((selectedTime / 30) * 0.50).toFixed(2)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    width: '90%',
    maxHeight: '80%',
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  closeButton: {
    position: 'absolute',
    right: 15,
    top: 15,
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 28,
    color: '#333',
  },
  businessHeader: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  businessIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  businessName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  timeOptionsContainer: {
    maxHeight: 280,
    marginBottom: 16,
  },
  timeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedTimeOption: {
    borderColor: '#E20074', // T-Mobile magenta
    backgroundColor: '#FFF0F7', // Light magenta
  },
  timeOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  selectedTimeOptionText: {
    color: '#E20074', // T-Mobile magenta
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  checkoutButton: {
    backgroundColor: '#E20074', // T-Mobile magenta
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default BusinessModal;