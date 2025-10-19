import { Text, View } from "react-native";
import { StripeProvider } from '@stripe/stripe-react-native';

const STRIPE_PUBLIC = process.env.STRIPE_PUBLIC as string

export default function Index() {
  return (
    <StripeProvider
      publishableKey={STRIPE_PUBLIC}
      merchantIdentifier="merchant.identifier" // required for Apple Pay
      urlScheme="your-url-scheme" // required for 3D Secure and bank redirects
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text>Edit app/index.tsx to edit this screen.</Text>
      </View>
    </StripeProvider>
  );
}
