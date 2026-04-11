import { calculateDirectFare } from "@/src/utils/fareMatrix";
import { fetchRouteDistance } from "@/src/utils/googleDirections";
import { useEffect, useState } from "react";

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

  // 🚀 EFFECT 1: FETCH DISTANCE (COSTS MONEY - RUN AS RARELY AS POSSIBLE)
  useEffect(() => {
    const calculateRoute = async () => {
      if (!finalDest) return;

      const isInitialDest =
        finalDest.lat === destLat && finalDest.lng === destLng;
      const noStopovers = stopovers.length === 0;

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

      // This hits the Google API!
      const totalKm = await fetchRouteDistance(origin, destination, waypoints);

      if (totalKm) {
        setCalculatedDistance(totalKm);
      }
      setIsCalculating(false);
    };

    calculateRoute();
    // ⚠️ NOTICE: isDiscountVerified is NOT in this array anymore!
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

  // 🚀 EFFECT 2: CALCULATE FARE (LOCAL MATH - 100% FREE)
  // This runs instantly whenever the distance OR the discount status changes.
  useEffect(() => {
    if (calculatedDistance) {
      setCalculatedFare(
        calculateDirectFare(calculatedDistance, isDiscountVerified),
      );
    }
  }, [calculatedDistance, isDiscountVerified]);

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
