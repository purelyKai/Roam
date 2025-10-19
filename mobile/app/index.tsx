import { Text, View, Pressable} from "react-native";
import { StripeProvider } from '@stripe/stripe-react-native';
import { Checkout } from '../utils/stripeCheckout';

const STRIPE_PUBLIC = process.env.STRIPE_PUBLIC as string

export default function Index() {
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

        <Pressable onPress={() => Checkout("price_1SJlk86PfUH9aqsh1rZ8BhBY", 1)}>
          <Text>BUTTON</Text>
        </Pressable>
      </View>
    </StripeProvider>
  );
}
