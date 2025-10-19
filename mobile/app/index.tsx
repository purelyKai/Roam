import { Redirect } from 'expo-router';
import { useRouter } from "expo-router";
import { Button, Text, View, Pressable } from "react-native";
import { StripeProvider } from '@stripe/stripe-react-native';

const STRIPE_PUBLIC = process.env.STRIPE_PUBLIC as string

export default function Index() {
  return <Redirect href="/home" />;
}
