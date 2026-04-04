import { getShortestDistanceToRoute } from "@/src/utils/routeDeviation";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { useAuth } from "../../../hooks/AuthContext"; // 🚀 2. Import Auth
import { api } from "../../../services/api"; // 🚀 1. Import your API
import { useLocationTracking } from "./useLocationTracking";

const DEVIATION_THRESHOLD_METERS = 100;

export const useActiveTrip = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth(); // 🚀 3. Grab the logged-in user

  // 1. Extract & Parse Data
  const fixedFare = params.fixedFare ? Number(params.fixedFare) : 0;
  const lockedDistance = params.lockedDistance
    ? Number(params.lockedDistance)
    : 0;
  const bodyNumber = (params.bodyNumber as string) || "888";

  // 🚀 Extract these new parameters (Make sure you are passing them from the booking screen!)
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
  const { currentLocation, drivenTrace } = useLocationTracking();
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
        onPress: async () => {
          // 🚀 Make this async!
          try {
            // Calculate base vs succeeding
            const base = 35;
            const succeeding = Math.max(0, fixedFare - base);
            const generatedTripId = `TRP-${Math.floor(100000 + Math.random() * 900000)}`;

            // 🚀 4. BUILD THE PAYLOAD FOR DJANGO
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
              actual_fare_charged: fixedFare,
              discount_applied: 0.0, // You can add logic to calculate this if user is Student/PWD
              status: "Completed",
              origin_lat: routeCoordinates[0]?.latitude || mapCenter.latitude,
              origin_lng: routeCoordinates[0]?.longitude || mapCenter.longitude,
              dest_lat: destLat,
              dest_lng: destLng,
              polyline_hash: JSON.stringify(drivenTrace),
            };

            // 🚀 5. SEND TO BACKEND
            await api.post("/trips/submit/", payload);

            // Format current date and time for the UI
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

            // 🚀 6. NAVIGATE TO RECEIPT (Passing the generated ID)
            router.replace({
              pathname: "/trip-receipt",
              params: {
                tripId: generatedTripId, // Pass the ID so the receipt matches the database
                totalFare: fixedFare,
                baseFare: base,
                succeedingFare: succeeding,
                distance: lockedDistance.toFixed(1),
                duration: `${estimatedMinutes} mins`,
                date: dateStr,
                time: timeStr,
                bodyNumber: bodyNumber,
                discountType: "Regular",
                originLat: routeCoordinates[0]?.latitude || mapCenter.latitude,
                originLng:
                  routeCoordinates[0]?.longitude || mapCenter.longitude,
                destLat: destLat,
                destLng: destLng,
                polylineHash: JSON.stringify(drivenTrace),
              },
            });
          } catch (error: any) {
            // 🚀 THIS WILL PRINT THE EXACT DJANGO ERROR TO YOUR TERMINAL
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
