import { ActiveFareMatrix, calculateDirectFare } from "@/src/utils/fareMatrix";
import { fetchRouteDistance } from "@/src/utils/googleDirections";
import { useEffect, useRef, useState } from "react";

export interface Stopover {
  id: string;
  name: string;
  subtext: string;
  latitude: number;
  longitude: number;
}

export const useTripSetup = (
  originLat: number,
  originLng: number,
  passedMode: string,
  passedDistance: number | null,
  passedFare: number | null,
  destLat: number | null,
  destLng: number | null,
  destName: string | null,
  activeMatrix: ActiveFareMatrix | null,
  isDiscountVerified: boolean = false,
) => {
  const [finalDest, setFinalDest] = useState<{
    lat: number;
    lng: number;
    name: string;
  } | null>(
    destLat && destLng
      ? { lat: destLat, lng: destLng, name: destName || "Pinned Location" }
      : null,
  );
  const [stopovers, setStopovers] = useState<Stopover[]>([]);
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(
    passedDistance,
  );
  const [calculatedFare, setCalculatedFare] = useState<number | null>(
    passedFare,
  );
  const [isCalculating, setIsCalculating] = useState(false);

  // store the last successful fetch parameters to prevent redundant API calls
  const lastFetchRef = useRef<string | null>(null);

  // fetch distance
  useEffect(() => {
    let isMounted = true;

    const calculateRoute = async () => {
      if (!finalDest) return;

      const isInitialDest =
        finalDest.lat === destLat && finalDest.lng === destLng;
      const noStopovers = stopovers.length === 0;

      // check if we can just use the free passed distance
      if (isInitialDest && noStopovers && passedDistance) {
        setCalculatedDistance(passedDistance);
        return;
      }

      setIsCalculating(true);
      const origin = { latitude: originLat, longitude: originLng };
      const destination = { latitude: finalDest.lat, longitude: finalDest.lng };
      const waypoints =
        passedMode === "SPECIAL"
          ? stopovers.map((stop) => ({
              latitude: stop.latitude,
              longitude: stop.longitude,
            }))
          : [];

      // prevent redundant requests by comparing current parameters with the last successful fetch
      const requestKey = JSON.stringify({ origin, destination, waypoints });
      if (lastFetchRef.current === requestKey) {
        if (isMounted) setIsCalculating(false);
        return;
      }

      lastFetchRef.current = requestKey;

      const totalKm = await fetchRouteDistance(origin, destination, waypoints);

      if (isMounted && totalKm) {
        setCalculatedDistance(totalKm);
      }
      if (isMounted) {
        setIsCalculating(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      calculateRoute();
    }, 800);

    return () => {
      isMounted = false;
      clearTimeout(delayDebounceFn);
    };
  }, [
    stopovers,
    finalDest,
    originLat,
    originLng,
    passedMode,
    destLat,
    destLng,
    passedDistance,
  ]);

  useEffect(() => {
    if (calculatedDistance && activeMatrix) {
      setCalculatedFare(
        calculateDirectFare(
          calculatedDistance,
          activeMatrix,
          isDiscountVerified,
        ),
      );
    }
  }, [calculatedDistance, isDiscountVerified, activeMatrix]);

  const removeStopover = (id: string) =>
    setStopovers((prev) => prev.filter((stop) => stop.id !== id));

  return {
    finalDest,
    setFinalDest,
    stopovers,
    setStopovers,
    calculatedDistance,
    calculatedFare,
    isCalculating,
    removeStopover,
  };
};
