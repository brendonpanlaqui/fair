import { getShortestDistanceToRoute } from "@/src/utils/routeDeviation";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { useLocationTracking } from "./useLocationTracking";

const DEVIATION_THRESHOLD_METERS = 100;

export const useActiveTrip = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // 1. Extract & Parse Data
  const fixedFare = params.fixedFare ? Number(params.fixedFare) : 0;
  const lockedDistance = params.lockedDistance
    ? Number(params.lockedDistance)
    : 0;
  const bodyNumber = (params.bodyNumber as string) || "888";

  const destLat = params.destLat ? Number(params.destLat) : null;
  const destLng = params.destLng ? Number(params.destLng) : null;

  const parsedStopovers = params.stopovers
    ? JSON.parse(params.stopovers as string)
    : [];
  const waypoints = parsedStopovers.map((stop: any) => ({
    latitude: Number(stop.latitude),
    longitude: Number(stop.longitude),
  }));

  // 2. Location & ETA Math
  const { currentLocation } = useLocationTracking();
  const mapCenter = currentLocation
    ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      }
    : { latitude: 15.149, longitude: 120.5779 };

  const estimatedMinutes = Math.max(1, Math.ceil(lockedDistance * 3));

  // 3. Safety & Deviation State
  const [isDeviationWarningVisible, setIsDeviationWarningVisible] =
    useState(false);
  const [secretTapCount, setSecretTapCount] = useState(0);
  const [routeCoordinates, setRouteCoordinates] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [deviationCount, setDeviationCount] = useState(0);

  // 4. Handlers
  const handleSecretDeviationTrigger = () => {
    setSecretTapCount((prev) => prev + 1);
    if (secretTapCount >= 2) {
      setIsDeviationWarningVisible(true);
      setSecretTapCount(0);
    }
  };

  const handleEndTrip = () => {
    Alert.alert("End Ride", "Are you sure you want to end this trip?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End Trip",
        style: "destructive",
        onPress: () => {
          // Format current date and time
          const now = new Date();
          const dateStr = now.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
          const timeStr = now.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          });

          // Calculate mockup breakdown (Base is 35, the rest is succeeding)
          const base = 35;
          const succeeding = Math.max(0, fixedFare - base);

          router.replace({
            pathname: "/trip-receipt",
            params: {
              totalFare: fixedFare,
              baseFare: base,
              succeedingFare: succeeding,
              distance: lockedDistance.toFixed(1),
              duration: `${estimatedMinutes} mins`,
              date: dateStr,
              time: timeStr,
              bodyNumber: bodyNumber,
              discountType: "Student", // We'll make this dynamic later based on the Profile!
            },
          });
        },
      },
    ]);
  };

  const handleReportDeviation = () => {
    setIsDeviationWarningVisible(false);
    router.replace({
      pathname: "/report",
      params: { tripId: "TRP-LIVE", bodyNumber, violation: "Detour" },
    });
  };

  // 5. Real-Time Route Monitoring Effect
  useEffect(() => {
    if (
      currentLocation &&
      routeCoordinates.length > 0 &&
      !isDeviationWarningVisible
    ) {
      const distanceToRoute = getShortestDistanceToRoute(
        currentLocation,
        routeCoordinates,
      );

      if (distanceToRoute > DEVIATION_THRESHOLD_METERS) {
        setDeviationCount((prev) => prev + 1);
        if (deviationCount >= 3) {
          setIsDeviationWarningVisible(true);
          setDeviationCount(0); // Reset for next time
        }
      } else {
        setDeviationCount(0); // Corrected course
      }
    }
  }, [currentLocation, routeCoordinates, isDeviationWarningVisible]);

  return {
    router,
    fixedFare,
    lockedDistance,
    bodyNumber,
    destLat,
    destLng,
    waypoints,
    parsedStopovers,
    currentLocation,
    mapCenter,
    estimatedMinutes,
    isDeviationWarningVisible,
    setIsDeviationWarningVisible,
    setRouteCoordinates,
    handleSecretDeviationTrigger,
    handleEndTrip,
    handleReportDeviation,
  };
};
