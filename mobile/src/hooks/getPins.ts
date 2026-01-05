import { useCallback, useEffect, useRef, useState } from "react";
import { BACKEND_URL } from "../constants";

type Pin = {
  id: string;
  lat: number;
  lng: number;
  name?: string;
  password: string;
  iconUrl: string;
  price?: number;
  ssid?: string;
  stripePaymentId?: string;
};

const PINS_CONFIG = {
  RADIUS: 2500,
  REFETCH_THRESHOLD: 0.5, // Percentage of radius to trigger refetch
};

function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const EARTH_RADIUS_METERS = 6371e3;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lng2 - lng1);

  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

function buildPinsUrl(lat: number, lng: number): string {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lng: lng.toString(),
    radius: PINS_CONFIG.RADIUS.toString(),
  });
  return `${BACKEND_URL}/pins?${params}`;
}

function useGetPins(userLat: number | null, userLng: number | null) {
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchLocationRef = useRef<{ lat: number; lng: number } | null>(
    null
  );

  const fetchPins = useCallback(async (lat: number, lng: number) => {
    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const url = buildPinsUrl(lat, lng);
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch pins: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      const pinsData = Array.isArray(data) ? data : data.pins || [];

      setPins(pinsData);
      lastFetchLocationRef.current = { lat, lng };
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      console.error("Error fetching pins:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
      setPins([]);
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  const refetch = useCallback(() => {
    if (userLat !== null && userLng !== null) {
      fetchPins(userLat, userLng);
    }
  }, [userLat, userLng, fetchPins]);

  const shouldRefetch = useCallback(
    (currentLat: number, currentLng: number): boolean => {
      const lastLocation = lastFetchLocationRef.current;
      if (!lastLocation) return true;

      const distance = calculateDistance(
        lastLocation.lat,
        lastLocation.lng,
        currentLat,
        currentLng
      );

      return distance > PINS_CONFIG.RADIUS * PINS_CONFIG.REFETCH_THRESHOLD;
    },
    []
  );

  useEffect(() => {
    if (userLat === null || userLng === null) {
      return;
    }

    if (shouldRefetch(userLat, userLng)) {
      fetchPins(userLat, userLng);
    }

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [userLat, userLng, shouldRefetch, fetchPins]);

  return { pins, loading, error, refetch } as const;
}

export type { Pin };
export default useGetPins;
