import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';

interface TopBarProps {
  hasActiveConnection?: boolean;
  showBackButton?: boolean;
}

export default function TopBar({ hasActiveConnection, showBackButton }: TopBarProps) {
  const router = useRouter();

  const handleActiveConnectionPress = () => {
    router.push('/pages/ElapsedTime');
  };

  const handleBackPress = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.content}>
        <View style={styles.leftSection}>
          {showBackButton ? (
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.logoText}>roam</Text>
          )}
        </View>
        {hasActiveConnection && !showBackButton && (
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
    backgroundColor: '#E20074',
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight,
  },
  content: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  activeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
    marginRight: 6,
  },
  activeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  backText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
  },
});