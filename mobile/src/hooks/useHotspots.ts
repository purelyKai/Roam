/**
 * Hotspots Hook - Fetches nearby WiFi hotspots from backend
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { BACKEND_URL } from "../constants";

/**
 * Hotspot represents a WiFi hotspot location
 */
export interface Hotspot {
  id: number;
  deviceId: string;
  name: string;
  iconUrl: string | null;
  latitude: number;
  longitude: number;
  ssid: string;
  password: string | null;
  pricePerMinuteCents: number;
  isOnline: boolean;
}

const RADIUS_METERS = 2500;
const REFETCH_THRESHOLD = 0.5;

function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Hook to fetch and manage nearby WiFi hotspots.
 *
 * @param userLat User's current latitude
 * @param userLng User's current longitude
 * @returns Object with hotspots array, loading state, error, and refetch function
 */
function useHotspots(userLat: number | null, userLng: number | null) {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const lastFetchRef = useRef<{ lat: number; lng: number } | null>(null);

  const fetchHotspots = useCallback(async (lat: number, lng: number) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        radius: RADIUS_METERS.toString(),
      });

      const response = await fetch(`${BACKEND_URL}/hotspots?${params}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch hotspots: ${response.status}`);
      }

      const data = await response.json();
      setHotspots(Array.isArray(data) ? data : data.hotspots || []);
      lastFetchRef.current = { lat, lng };
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("Error fetching hotspots:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
      setHotspots([]);
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, []);

  const refetch = useCallback(() => {
    if (userLat !== null && userLng !== null) {
      fetchHotspots(userLat, userLng);
    }
  }, [userLat, userLng, fetchHotspots]);

  const shouldRefetch = useCallback((lat: number, lng: number): boolean => {
    if (!lastFetchRef.current) return true;
    const dist = calculateDistance(
      lastFetchRef.current.lat,
      lastFetchRef.current.lng,
      lat,
      lng
    );
    return dist > RADIUS_METERS * REFETCH_THRESHOLD;
  }, []);

  useEffect(() => {
    if (userLat === null || userLng === null) return;

    if (shouldRefetch(userLat, userLng)) {
      fetchHotspots(userLat, userLng);
    }

    return () => abortRef.current?.abort();
  }, [userLat, userLng, shouldRefetch, fetchHotspots]);

  return { hotspots, loading, error, refetch } as const;
}

export default useHotspots;

/**
 * Helper function to format hotspot price.
 *
 * @param pricePerMinuteCents Price per minute in cents
 * @param minutes Duration in minutes
 * @returns Formatted price string (e.g., "$1.20")
 */
export function formatHotspotPrice(
  pricePerMinuteCents: number,
  minutes: number
): string {
  const totalCents = pricePerMinuteCents * minutes;
  return `$${(totalCents / 100).toFixed(2)}`;
}

/**
 * Calculate total price in cents for a duration.
 */
export function calculatePriceCents(
  pricePerMinuteCents: number,
  minutes: number
): number {
  return pricePerMinuteCents * minutes;
}
