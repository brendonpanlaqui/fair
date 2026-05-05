import { calculateDirectFare } from "@/src/utils/fareMatrix";
import {
  calculateTraceDistanceKm,
  isWithinAngelesCity,
} from "@/src/utils/geofencing";
import { resetSmoothing } from "@/src/utils/gpsSmoothing";
import { getShortestDistanceToRoute } from "@/src/utils/routeDeviation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { useAuth } from "../../../hooks/AuthContext";
import { api } from "../../../services/api";
import { useLocationTracking } from "./useLocationTracking";

const DEVIATION_THRESHOLD_METERS = 100;

// 🚀 FIX 2: A safety wrapper to prevent JSON.parse from causing white screens
const safeParseJSON = (jsonString: any, fallback: any) => {
  if (!jsonString || jsonString === "undefined" || jsonString === "null")
    return fallback;
  try {
    return JSON.parse(jsonString as string);
  } catch (e) {
    console.warn("Failed to parse JSON param:", jsonString);
    return fallback;
  }
};

export const useActiveTrip = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, isDiscountVerified } = useAuth();

  // 1. Extract Initial Parameters safely
  const initialFare =
    params.fixedFare && params.fixedFare !== "undefined"
      ? Number(params.fixedFare)
      : 0;
  const initialDistance =
    params.lockedDistance && params.lockedDistance !== "undefined"
      ? Number(params.lockedDistance)
      : 0;

  // 2. Setup Dynamic State (Allows us to prorate fare if boundary is hit)
  const [dynamicFare, setDynamicFare] = useState(initialFare);
  const [dynamicDistance, setDynamicDistance] = useState(initialDistance);

  // 3. Parse remaining parameters using the safety wrapper
  const activeMatrix = safeParseJSON(params.matrixStr, null);
  const parsedStopovers = safeParseJSON(params.stopovers, []);

  const bodyNumber = (params.bodyNumber as string) || "888";
  const originName = (params.originName as string) || "Unknown Origin";
  const destName = (params.destName as string) || "Unknown Destination";
  const matrixId =
    params.matrixId && params.matrixId !== "undefined"
      ? Number(params.matrixId)
      : 1;
  const destLat =
    params.destLat && params.destLat !== "undefined"
      ? Number(params.destLat)
      : null;
  const destLng =
    params.destLng && params.destLng !== "undefined"
      ? Number(params.destLng)
      : null;

  const waypoints = parsedStopovers.map((stop: any) => ({
    latitude: Number(stop.latitude),
    longitude: Number(stop.longitude),
  }));

  // 4. Location & Tracking
  const { currentLocation, drivenTrace, stopTracking } =
    useLocationTracking(true);
  const mapCenter = currentLocation
    ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      }
    : { latitude: 15.149, longitude: 120.5779 };

  const estimatedMinutes = Math.max(1, Math.ceil(dynamicDistance * 3));

  // 5. Safety & Deviation State
  const [isDeviationWarningVisible, setIsDeviationWarningVisible] =
    useState(false);
  const [secretTapCount, setSecretTapCount] = useState(0);
  const [routeCoordinates, setRouteCoordinates] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [deviationCount, setDeviationCount] = useState(0);
  const [hasLeftCity, setHasLeftCity] = useState(false);
  const [isEarlyDropoff, setIsEarlyDropoff] = useState(false);
  const [originalFare, setOriginalFare] = useState(0);

  // --- Handlers ---
  const handleSecretDeviationTrigger = () => {
    setSecretTapCount((prev) => prev + 1);
    if (secretTapCount >= 2) {
      setIsDeviationWarningVisible(true);
      setSecretTapCount(0);
    }
  };

  // 🚀 CALCULATE EARLY DROP-OFF (Fires right before Arrival UI mounts)
  const prepareArrival = () => {
    if (drivenTrace && drivenTrace.length > 1) {
      const actualDistanceKm = calculateTraceDistanceKm(drivenTrace);

      // If they dropped off at least 200 meters early (0.2 km margin)
      if (activeMatrix && actualDistanceKm < dynamicDistance - 0.2) {
        const proratedFare = calculateDirectFare(
          actualDistanceKm,
          activeMatrix,
          isDiscountVerified,
        );

        // Only apply if the prorated fare is actually cheaper
        if (proratedFare < dynamicFare) {
          setIsEarlyDropoff(true);
          setOriginalFare(dynamicFare);
          setDynamicDistance(actualDistanceKm);
          setDynamicFare(proratedFare);
        }
      }
    }
  };

  const commitTrip = async (
    finalFareCharged: number,
    isForcedCancel: boolean = false,
    isForcedComplete: boolean = false,
    overrideComputedFare?: number,
    overrideDistance?: number,
    isTip: boolean = false,
  ) => {
    try {
      await stopTracking();
      resetSmoothing();

      // Resolve the true values: use overrides if provided immediately by Geofence, otherwise fallback to UI state
      const resolvedFare = overrideComputedFare ?? dynamicFare;
      const resolvedDistance = overrideDistance ?? dynamicDistance;

      const base = 35;
      const succeeding = Math.max(0, resolvedFare - base);
      const generatedTripId = `TRP-${Math.floor(100000 + Math.random() * 900000)}`;

      let tripStatus = "Cancelled";
      if (isForcedCancel) {
        tripStatus = "Cancelled";
      } else if (isForcedComplete || resolvedDistance >= 0.05) {
        // Fallback: If not explicitly ended/cancelled, assume completed if they traveled at least 50 meters
        tripStatus = "Completed";
      }

      // BUILD PAYLOAD
      const payload = {
        trip_id: generatedTripId,
        user: user?.id || null,
        tricycle: bodyNumber,
        fare_matrix: matrixId,
        trip_mode: parsedStopovers.length > 0 ? "Special" : "Direct",
        origin_address: originName,
        destination_address: destName,
        total_distance_km: resolvedDistance, // Uses fresh data
        computed_fare: resolvedFare, // Uses fresh data
        actual_fare_charged: tripStatus === "Completed" ? finalFareCharged : 0,
        discount_applied: 0.0,
        status: tripStatus,
        origin_lat: drivenTrace[0]?.latitude || mapCenter.latitude,
        origin_lng: drivenTrace[0]?.longitude || mapCenter.longitude,
        dest_lat: destLat,
        dest_lng: destLng,
        polyline_hash: JSON.stringify(drivenTrace),
      };

      let isOfflineSaved = false;

      // API CALL
      try {
        await api.post("/trips/submit/", payload);
      } catch (submitError: any) {
        const isNetworkError =
          !submitError.response ||
          (submitError.message &&
            submitError.message.toLowerCase().includes("network")) ||
          (submitError.response && submitError.response.status >= 500);

        if (isNetworkError) {
          try {
            const storedPending = await AsyncStorage.getItem("@pending_trips");
            const pendingTrips = storedPending ? JSON.parse(storedPending) : [];
            pendingTrips.push(payload);
            await AsyncStorage.setItem(
              "@pending_trips",
              JSON.stringify(pendingTrips),
            );
            isOfflineSaved = true;

            Alert.alert(
              "Offline Mode",
              "You appear to be offline. Your trip has been saved locally and will sync when your connection is restored.",
            );
          } catch (e) {
            console.error("Failed to save pending trip offline", e);
          }
        } else {
          throw submitError;
        }
      }

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

      // NAVIGATE TO RECEIPT
      router.replace({
        pathname: "/trip-receipt",
        params: {
          tripId: generatedTripId,
          totalFare: resolvedFare,
          actualFare: finalFareCharged,
          baseFare: base,
          succeedingFare: succeeding,
          distance: resolvedDistance.toFixed(1),
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
          isOfflineSaved: isOfflineSaved ? "true" : "false",
          isTip: isTip ? "true" : "false", // 🚀 Pass tip status to receipt
        },
      });
    } catch (error: any) {
      console.log("\n--- API ERROR ---");
      console.log(
        JSON.stringify(error.response?.data || error.message, null, 2),
      );

      let errorTitle = "Trip Save Failed";
      let errorMessage =
        "Something went wrong while saving your trip. Please try again.";

      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.fare_matrix) {
          errorTitle = "Invalid Fare Matrix";
          errorMessage =
            "There is an issue with the selected fare matrix. Please try again.";
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
      } else if (
        error.message &&
        error.message.toLowerCase().includes("network")
      ) {
        errorTitle = "No Internet Connection";
        errorMessage =
          "We couldn't connect to the server. Please check your data or Wi-Fi and try again.";
      }

      Alert.alert(errorTitle, errorMessage);
    }
  };

  const handleEndTrip = (askedFare?: string, isTip: boolean = false) => {
    // Falls back to dynamicFare if no valid askedFare is provided
    const finalFareCharged =
      askedFare && !isNaN(Number(askedFare)) ? Number(askedFare) : dynamicFare;

    // Execute immediately with the tip flag
    commitTrip(finalFareCharged, false, true, undefined, undefined, isTip);
  };

  const handleCancelTrip = () => {
    Alert.alert(
      "Cancel Tracking?",
      "If you stop tracking now, this trip will be marked as Cancelled in your history.",
      [
        { text: "Keep Riding", style: "cancel" },
        {
          text: "Stop Tracking",
          style: "destructive",
          onPress: () => commitTrip(0, true),
        },
      ],
    );
  };

  const handleReportDeviation = async () => {
    setIsDeviationWarningVisible(false);
    await stopTracking();
    resetSmoothing();
    router.replace({
      pathname: "/report",
      params: { tripId: "TRP-LIVE", bodyNumber, violation: "Detour" },
    });
  };

  // --- Effects ---

  // Deviation Tracking
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

  // Real-time Geofencing Boundary Check
  useEffect(() => {
    if (currentLocation && !hasLeftCity) {
      if (
        !isWithinAngelesCity(
          currentLocation.latitude,
          currentLocation.longitude,
        )
      ) {
        setHasLeftCity(true);

        // 1. Calculate actual distance driven safely
        const actualDistanceKm =
          drivenTrace && drivenTrace.length > 1
            ? calculateTraceDistanceKm(drivenTrace)
            : dynamicDistance; // Fallback to current distance if GPS hasn't fully logged yet

        // 2. Recalculate prorated fare using matrix
        let proratedFare = dynamicFare;
        if (activeMatrix) {
          proratedFare = calculateDirectFare(
            actualDistanceKm,
            activeMatrix,
            isDiscountVerified,
          );
        }

        // 3. Lock new values into state
        setDynamicDistance(actualDistanceKm);
        setDynamicFare(proratedFare);

        Alert.alert(
          "📍 City Limits Reached",
          "You have crossed outside the Angeles City boundaries. The LGU-regulated fare ordinance no longer applies.\n\nYour tracked trip will now end and lock the official fare up to this point. Any further travel is subject to private agreement with the driver.",
          [
            {
              text: "Acknowledge & End Trip",
              style: "destructive",
              // 4. Force save the trip using the prorated fare as an immediate override!
              onPress: () =>
                commitTrip(
                  proratedFare,
                  false,
                  true,
                  proratedFare,
                  actualDistanceKm,
                ),
            },
          ],
          { cancelable: false },
        );
      }
    }
  }, [
    currentLocation,
    hasLeftCity,
    drivenTrace,
    activeMatrix,
    isDiscountVerified,
  ]);

  return {
    router,
    fixedFare: dynamicFare, // ALIASED so UI components don't break
    lockedDistance: dynamicDistance, // ALIASED so UI components don't break
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
    isEarlyDropoff,
    originalFare,
    prepareArrival,
    handleSecretDeviationTrigger,
    handleEndTrip,
    handleCancelTrip,
    handleReportDeviation,
    stopTracking,
  };
};
