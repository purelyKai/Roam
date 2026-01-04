import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/src/navigation/types";

interface TopBarProps {
  hasActiveConnection?: boolean;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function TopBar({ hasActiveConnection }: TopBarProps) {
  const navigation = useNavigation<NavigationProp>();

  const handleActiveConnectionPress = () => {
    navigation.navigate("ElapsedTime");
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <Image
            source={require("@/src/assets/images/logo.png")}
            style={styles.logoImage}
          />
        </View>
        {hasActiveConnection && (
          <TouchableOpacity
            style={styles.activeButton}
            onPress={handleActiveConnectionPress}
          >
            <View style={styles.activeDot} />
            <Text style={styles.activeText}>Active</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#E20074",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  content: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderColor: "white",
    borderWidth: 1,
  },
  logoText: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  activeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4ADE80",
    marginRight: 6,
  },
  activeText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  backText: {
    color: "white",
    fontSize: 24,
    fontWeight: "600",
  },
});
