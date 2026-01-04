import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, borderRadius, typography } from "../constants";

export default function TopBar() {
  const insets = useSafeAreaInsets();
  const hasActiveConnection = true;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Image
        source={require("@/src/assets/images/logo.png")}
        style={styles.logo}
      />

      <TouchableOpacity style={styles.statusButton} activeOpacity={0.7}>
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: hasActiveConnection
                ? colors.success
                : colors.white,
            },
          ]}
        />
        <Text style={styles.statusText}>
          {hasActiveConnection ? "Active" : "Inactive"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.white,
  },
  statusButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.whiteOverlay,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    minWidth: 85,
  },
  statusDot: {
    width: spacing.md,
    height: spacing.md,
    borderRadius: borderRadius.xs,
    marginRight: spacing.sm,
  },
  statusText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
});
