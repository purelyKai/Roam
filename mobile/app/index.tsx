import { useRouter } from "expo-router";
import { Button, Text, View } from "react-native";

export default function Index() {

  const router = useRouter();

  return (
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
  );
}
