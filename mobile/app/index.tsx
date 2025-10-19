import { useRouter } from "expo-router";
import { Button, Text, View, Pressable } from "react-native";
import { StripeProvider } from '@stripe/stripe-react-native';

const STRIPE_PUBLIC = process.env.STRIPE_PUBLIC as string

export default function Index() {

  const router = useRouter();

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
        }}
      >
        <Text>Edit app/index.tsx to edit this screen.</Text>
        <Button title="Go to About" onPress={() => router.navigate('/home')} />
      </View>
    </StripeProvider>
  );
}
