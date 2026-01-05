import React, { useState } from "react";
import { View, StyleSheet, Text, Image, Platform } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { BusinessModal } from "@/src/components";
import useGetPins, { Pin } from "@/src/hooks/getPins";
import { RootState } from "@/src/store/store";
import { useAppSelector } from "@/src/store/hooks";
import { useLocationWatcher } from "@/src/hooks/useLocationWatcher";

export default function HomeScreen() {
  useLocationWatcher();

  const location = useAppSelector((state: RootState) => state.location.current);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);

  const { pins } = useGetPins(
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
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            onPress={() => setSelectedPin(pin)}
            coordinate={{ latitude: pin.lat, longitude: pin.lng }}
            title={pin.name || "Untitled"}
          />
        ))}
      </MapView>
      <BusinessModal pin={selectedPin} onClose={() => setSelectedPin(null)} />
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
