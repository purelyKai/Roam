import { useEffect, useRef } from "react";
import * as Location from "expo-location";
import { useAppDispatch } from "@/src/store/hooks";
import {
  initializeLocation,
  setLocation,
} from "@/src/store/slices/locationSlice";

export function useLocationWatcher() {
  const dispatch = useAppDispatch();
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function startWatching() {
      // Initialize location and get permissions
      const result = await dispatch(initializeLocation());

      if (initializeLocation.rejected.match(result) || cancelled) {
        return; // Permission denied or error
      }

      // Start watching location
      try {
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced, // Balanced accuracy (within 100 meters)
            distanceInterval: 50, // Update every 50 meters
          },
          (location) => {
            dispatch(setLocation(location));
          }
        );

        if (cancelled) {
          subscription.remove(); // Clean up if unmounted during setup
          return;
        }

        subscriptionRef.current = subscription;
      } catch (error) {
        console.error("Failed to watch location:", error);
      }
    }

    startWatching();

    // Cleanup
    return () => {
      cancelled = true;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, [dispatch]);
}
