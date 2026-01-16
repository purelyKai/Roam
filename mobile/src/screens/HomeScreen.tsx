import React, { useState } from "react";
import { View, StyleSheet, Text, Platform } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { BusinessModal } from "@/src/components";
import { useHotspots, Hotspot, useLocationWatcher } from "@/src/hooks";
import { RootState } from "@/src/store/store";
import { useAppSelector } from "@/src/store/hooks";

export default function HomeScreen() {
  useLocationWatcher();

  const location = useAppSelector((state: RootState) => state.location.current);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);

  const { hotspots } = useHotspots(
    location?.coords.latitude ?? null,
    location?.coords.longitude ?? null
  );

  if (!location) {
    return (
      <View style={styles.container}>
        <Text>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {hotspots.map((hotspot) => (
          <Marker
            key={hotspot.id}
            onPress={() => setSelectedHotspot(hotspot)}
            coordinate={{
              latitude: hotspot.latitude,
              longitude: hotspot.longitude,
            }}
            title={hotspot.name || "Untitled"}
            pinColor={hotspot.isOnline ? "#E20074" : "#999"}
          />
        ))}
      </MapView>
      <BusinessModal
        hotspot={selectedHotspot}
        onClose={() => setSelectedHotspot(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  map: {
    flex: 1,
  },
});
