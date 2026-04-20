import { getShortestDistanceToRoute } from "@/src/utils/routeDeviation";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { useAuth } from "../../../hooks/AuthContext";
import { api } from "../../../services/api";
import { useLocationTracking } from "./useLocationTracking";

const DEVIATION_THRESHOLD_METERS = 100;

export const useActiveTrip = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();

  // 1. Extract & Parse Data
  const fixedFare = params.fixedFare ? Number(params.fixedFare) : 0;
  const lockedDistance = params.lockedDistance
    ? Number(params.lockedDistance)
    : 0;
  const bodyNumber = (params.bodyNumber as string) || "888";
  const originName = (params.originName as string) || "Unknown Origin";
  const destName = (params.destName as string) || "Unknown Destination";
  const matrixId = params.matrixId ? Number(params.matrixId) : 1;
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
  const { currentLocation, drivenTrace, stopTracking } = useLocationTracking();
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

  // 🚀 UPDATED: Accepting the askedFare from the UI
  const handleEndTrip = (askedFare?: string) => {
    // 🚀 THE FIX: Safely parse the user's input into a number for Django.
    // If they left it blank or typed nonsense, we default to the official fixedFare.
    const finalFareCharged =
      askedFare && !isNaN(Number(askedFare)) ? Number(askedFare) : fixedFare;

    Alert.alert(
      "End Ride",
      "Are you sure you want to end this trip and generate a receipt?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Generate Receipt",
          style: "destructive",
          onPress: async () => {
            try {
              await stopTracking();

              const base = 35;
              const succeeding = Math.max(0, fixedFare - base);
              const generatedTripId = `TRP-${Math.floor(100000 + Math.random() * 900000)}`;

              // 🚀 BUILD THE PAYLOAD FOR DJANGO
              const payload = {
                trip_id: generatedTripId,
                user: user?.id || null,
                tricycle: bodyNumber,
                fare_matrix: matrixId,
                trip_mode: parsedStopovers.length > 0 ? "Special" : "Direct",
                origin_address: originName,
                destination_address: destName,
                total_distance_km: lockedDistance,
                computed_fare: fixedFare,
                actual_fare_charged: finalFareCharged, // 🚀 NOW SAVING THE ACTUAL FARE!
                discount_applied: 0.0,
                status: "Completed",
                origin_lat: drivenTrace[0]?.latitude || mapCenter.latitude,
                origin_lng: drivenTrace[0]?.longitude || mapCenter.longitude,
                dest_lat: destLat,
                dest_lng: destLng,
                polyline_hash: JSON.stringify(drivenTrace),
              };

              await api.post("/trips/submit/", payload);

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

              // 🚀 NAVIGATE TO RECEIPT
              router.replace({
                pathname: "/trip-receipt",
                params: {
                  tripId: generatedTripId,
                  totalFare: fixedFare, // The official LGU computed fare
                  actualFare: finalFareCharged, // 🚀 NEW: Pass this to show overcharging on the receipt!
                  baseFare: base,
                  succeedingFare: succeeding,
                  distance: lockedDistance.toFixed(1),
                  duration: `${estimatedMinutes} mins`,
                  date: dateStr,
                  time: timeStr,
                  bodyNumber: bodyNumber,
                  discountType: "Regular",
                  originLat: drivenTrace[0]?.latitude || mapCenter.latitude,
                  originLng: drivenTrace[0]?.longitude || mapCenter.longitude,
                  destLat: destLat,
                  destLng: destLng,
                  polylineHash: JSON.stringify(drivenTrace),
                },
              });
            } catch (error: any) {
              console.log("\n--- DJANGO REJECTED THE TRIP ---");
              console.log(
                JSON.stringify(error.response?.data || error.message, null, 2),
              );
              console.log("--------------------------------\n");
              Alert.alert(
                "Sync Failed",
                "Check your Expo terminal to see exactly what Django rejected!",
              );
            }
          },
        },
      ],
    );
  };

  const handleReportDeviation = () => {
    setIsDeviationWarningVisible(false);
    router.replace({
      pathname: "/report",
      params: { tripId: "TRP-LIVE", bodyNumber, violation: "Detour" },
    });
  };

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
          setDeviationCount(0);
        }
      } else {
        setDeviationCount(0);
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
