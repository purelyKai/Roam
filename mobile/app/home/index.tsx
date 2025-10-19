
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

import * as Location from 'expo-location';
import useGetPins from "@/hooks/getPins";

export default function Index() {
	const initialRegion = {
		latitude: 37.78825,
		longitude: -122.4324,
		latitudeDelta: 0.0122,
		longitudeDelta: 0.0121,
	};

    const [location, setLocation] = useState<Location.LocationObject | null>(null); 
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const { pins } = useGetPins(location ? { lat: location.coords.latitude, lng: location.coords.longitude, radius: 2500 } : null);

    useEffect(() => {
        async function getCurrentLocation() {
        
        let { status } = await Location.requestForegroundPermissionsAsync();
        console.log(status)
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

    console.log(pins)

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.topBar}>
				<Text style={styles.title}>Roam</Text>
				<Text style={styles.subtitle}>Explore the map</Text>
			</View>

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
                        coordinate={{ latitude: pin.lat, longitude: pin.lng }}
                        title={pin.name || "Untitled"}
                    />
                ))}
			</MapView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
	},
	topBar: {
		width: "100%",
		paddingVertical: 12,
		paddingHorizontal: 16,
		backgroundColor: "rgba(255,255,255,0.95)",
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: "#ddd",
		zIndex: 2,
	},
	title: {
		fontSize: 18,
		fontWeight: "600",
	},
	subtitle: {
		fontSize: 12,
		color: "#666",
	},
	map: {
		flex: 1,
		zIndex: 1,
	},
});
