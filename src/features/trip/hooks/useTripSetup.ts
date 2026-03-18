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
) => {
  const [finalDest, setFinalDest] = useState<{
    lat: number;
    lng: number;
    name: string;
  } | null>(
    destLat && destLng
      ? { lat: destLat, lng: destLng, name: "Selected Destination" }
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

  useEffect(() => {
    const calculateRoute = async () => {
      if (!finalDest) return;

      const isInitialDest =
        finalDest.lat === destLat && finalDest.lng === destLng;
      const noStopovers = stopovers.length === 0;

      if (isInitialDest && noStopovers && passedDistance && passedFare) {
        setCalculatedDistance(passedDistance);
        setCalculatedFare(passedFare);
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

      const totalKm = await fetchRouteDistance(origin, destination, waypoints);

      if (totalKm) {
        setCalculatedDistance(totalKm);
        setCalculatedFare(calculateDirectFare(totalKm));
      }
      setIsCalculating(false);
    };

    calculateRoute();
  }, [
    stopovers,
    finalDest,
    originLat,
    originLng,
    passedMode,
    destLat,
    destLng,
    passedDistance,
    passedFare,
  ]);

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
