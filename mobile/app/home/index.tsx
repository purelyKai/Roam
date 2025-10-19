
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopBar from '../../components/TopBar';

export default function Index() {
  // For testing purposes, always show active connection
  const hasActiveConnection = true;

  return (
    <View style={styles.container}>
      <TopBar hasActiveConnection={hasActiveConnection} showBackButton={false} />
      <SafeAreaView style={styles.content}>
        {/* Blank content area */}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
});
