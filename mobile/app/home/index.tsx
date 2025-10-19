
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopBar from '../../components/TopBar';
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

import * as Location from 'expo-location';
import useGetPins, { Pin } from "@/hooks/getPins";
import BusinessModal from '@/components/BusinessModal';

export default function Index() {
	const initialRegion = {
		latitude: 37.78825,
		longitude: -122.4324,
		latitudeDelta: 0.0122,
		longitudeDelta: 0.0121,
	};

    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [selectedPin, setSelectedPin] = useState<Pin | null>(null); 
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const hasActiveConnection = true;
    const { pins } = useGetPins(location ? { lat: location.coords.latitude, lng: location.coords.longitude, radius: 2500 } : null);

    useEffect(() => {
        async function getCurrentLocation() {
        
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            setErrorMsg('Permission to access location was denied');
            return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);
        }

        getCurrentLocation();
    }, []);

    if (!location) {
        return (
            <View style={styles.container}>
                <Text>Loading map...</Text>
            </View>
        );
    }

	return (
		<SafeAreaView style={styles.container}>
      <TopBar hasActiveConnection={hasActiveConnection} showBackButton={false} />

			<MapView
				style={styles.map}
				provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
				initialRegion={ { latitude: location.coords.latitude, longitude: location.coords.longitude, latitudeDelta: 0.0122, longitudeDelta: 0.0122 } }
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
            <BusinessModal businessName={selectedPin?.name || ''} visible={selectedPin !== null} onClose={() => setSelectedPin(null)} businessIcon={selectedPin?.iconUrl || ''} />
		</SafeAreaView>
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
  map: {
    flex: 1,
  },
});
