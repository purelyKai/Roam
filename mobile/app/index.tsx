import { useRouter } from "expo-router";
import { Button, Text, View, Pressable} from "react-native";
import { useState } from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';
import { Checkout } from '../utils/stripeCheckout';

import BusinessModal from "@/components/BusinessModal";

const STRIPE_PUBLIC = process.env.STRIPE_PUBLIC as string

export default function Index() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <StripeProvider
      publishableKey={STRIPE_PUBLIC}
      merchantIdentifier="merchant.identifier" // required for Apple Pay
      urlScheme="roam" // required for 3D Secure and bank redirects
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          gap: 20,
        }}
      >
        <Pressable
          onPress={() => setModalVisible(true)}
          style={{
            backgroundColor: '#00704A', // Starbucks green
            padding: 15,
            borderRadius: 8,
            minWidth: 200,
          }}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontSize: 16, fontWeight: '600' }}>
            Test Starbucks WiFi
          </Text>
        </Pressable>

        <Button 
          title="Go to About" 
          onPress={() => router.navigate('/home')} 
        />

        <BusinessModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          businessName="Starbucks"
          businessIcon="https://eu-images.contentstack.com/v3/assets/bltea7aee2fca050a19/bltcc157be03a336644/6724e088ca36fb0e631eeb88/Starbucks-HOTC.jpg"
        />
      </View>
    </StripeProvider>
  );
}
