import { useCallback, useEffect, useRef, useState } from "react";

export type Pin = {
  id: string;
  lat: number;
  lng: number;

  // display / metadata
  name?: string;
  password: string;
  iconUrl: string;
  price?: number;
  ssid?: string;
  stripePaymentId?: string;
};

type UseGetPinsOptions = {
  enabled?: boolean; // auto-fetch when params change
  fetchOptions?: RequestInit;
  defaultRadius?: number;
};

/**
 * Resolve EXPO_PUBLIC_BACKEND_URL from environment
 */
function getBackendUrl() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const expoPublic = (process as any).env?.EXPO_PUBLIC_BACKEND_URL;
  if (
    expoPublic &&
    typeof expoPublic === "string" &&
    expoPublic.trim().length > 0
  ) {
    return expoPublic.replace(/\/+$/, "");
  }
  throw new Error("EXPO_PUBLIC_BACKEND_URL is not defined");
}

/**
 * useGetPins
 * @param params { lat, lng, radius }
 * @param options control auto-fetch and fetch options
 */
export default function useGetPins(
  params: { lat: number; lng: number; radius?: number } | null,
  options: UseGetPinsOptions = {}
) {
  const { enabled = true, fetchOptions, defaultRadius = 1000 } = options;
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const controllerRef = useRef<AbortController | null>(null);

  const backend = getBackendUrl();

  const buildUrl = useCallback(
    (lat: number, lng: number, radius: number) => {
      const base = backend.replace(/\/+$/, "");
      const qs = `lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(
        lng
      )}&radius=${encodeURIComponent(radius)}`;
      return `${base}/pins?${qs}`;
    },
    [backend]
  );

  const doFetch = useCallback(
    async (lat: number, lng: number, radius: number) => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }

      const controller = new AbortController();
      controllerRef.current = controller;

      setLoading(true);
      setError(null);

      const url = buildUrl(lat, lng, radius);

      try {
        const res = await fetch(url, {
          signal: controller.signal,
          ...(fetchOptions || {}),
        });
        if (!res.ok)
          throw new Error(
            `Failed to fetch pins: ${res.status} ${res.statusText}`
          );
        const data = await res.json();

        // expect an array of pins from backend; fall back to empty
        if (Array.isArray(data)) setPins(data as Pin[]);
        else if (data && Array.isArray((data as any).pins))
          setPins((data as any).pins as Pin[]);
        else setPins([]);
      } catch (err: unknown) {
        console.error("Error fetching pins:", err);
        if ((err as any)?.name === "AbortError") return; // aborted
        setError(err as Error);
        setPins([]);
      } finally {
        setLoading(false);
        controllerRef.current = null;
      }
    },
    [buildUrl, fetchOptions]
  );

  const refetch = useCallback(() => {
    if (!params) return;
    const r = params.radius ?? defaultRadius;
    void doFetch(params.lat, params.lng, r);
  }, [doFetch, params, defaultRadius]);

  useEffect(() => {
    if (!params) return;
    if (!enabled) return;

    const r = params.radius ?? defaultRadius;
    void doFetch(params.lat, params.lng, r);

    return () => {
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, [params, enabled, doFetch, defaultRadius]);

  return { pins, loading, error, refetch } as const;
}
