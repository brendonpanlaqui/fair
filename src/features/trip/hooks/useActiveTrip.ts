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

// a safety wrapper to prevent JSON.parse from causing white screens
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

  // extract Initial Parameters safely
  const initialFare =
    params.fixedFare && params.fixedFare !== "undefined"
      ? Number(params.fixedFare)
      : 0;
  const initialDistance =
    params.lockedDistance && params.lockedDistance !== "undefined"
      ? Number(params.lockedDistance)
      : 0;

  // setup Dynamic State (Allows us to prorate fare if boundary is hit)
  const [dynamicFare, setDynamicFare] = useState(initialFare);
  const [totalTripDistance, setTotalTripDistance] = useState(initialDistance);

  // state for the dynamically updating remaining distance and time
  const [remainingDistance, setRemainingDistance] = useState(initialDistance);
  const [remainingTime, setRemainingTime] = useState(
    Math.max(1, Math.ceil(initialDistance * 3)),
  );
  // parse remaining parameters using the safety wrapper
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

  // Location & Tracking
  const { currentLocation, drivenTrace, stopTracking } =
    useLocationTracking(true);
  const mapCenter = currentLocation
    ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      }
    : { latitude: 15.149, longitude: 120.5779 };

  // Effect to calculate remaining distance and ETA as the user moves
  useEffect(() => {
    if (drivenTrace.length > 1) {
      const distanceTraveled = calculateTraceDistanceKm(drivenTrace);
      const newRemainingDistance = Math.max(
        0,
        totalTripDistance - distanceTraveled,
      );
      setRemainingDistance(newRemainingDistance);
      setRemainingTime(Math.max(1, Math.ceil(newRemainingDistance * 3)));
    }
  }, [drivenTrace, totalTripDistance]);

  const [isNearDestination, setIsNearDestination] = useState(false);

  useEffect(() => {
    if (currentLocation && destLat && destLng) {
      // Standard Haversine formula implementation
      const R = 6371e3; // Earth radius in meters
      const phi1 = (currentLocation.latitude * Math.PI) / 180;
      const phi2 = (destLat * Math.PI) / 180;
      const deltaPhi = ((destLat - currentLocation.latitude) * Math.PI) / 180;
      const deltaLambda =
        ((destLng - currentLocation.longitude) * Math.PI) / 180;

      const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) *
          Math.cos(phi2) *
          Math.sin(deltaLambda / 2) *
          Math.sin(deltaLambda / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceMeters = R * c;

      setIsNearDestination(distanceMeters <= 50);
    }
  }, [currentLocation, destLat, destLng]);

  // 1. Extract the Real Trip ID (with a fallback just for testing)
  const tripId =
    (params.tripId as string) ||
    `TRP-${Math.floor(100000 + Math.random() * 900000)}`;

  // 2. Add this new state
  const [isDriverFinished, setIsDriverFinished] = useState(false);

  // 3. Add the Polling Loop
  useEffect(() => {
    // Don't poll if we are using a fake testing ID
    if (!tripId || tripId.startsWith("TRP-")) return;

    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/trips/${tripId}/status/`);
        if (response.data.status === "Completed") {
          clearInterval(interval);
          prepareArrival(); // Stop tracking GPS and calculate prorated fare
          setIsDriverFinished(true); // Signal the UI to show the overlay
        }
      } catch (error) {
        console.warn("Silent polling error:", error);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [tripId]);

  // Safety & Deviation State
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

  // CALCULATE EARLY DROP-OFF
  const prepareArrival = () => {
    if (drivenTrace && drivenTrace.length > 1) {
      const actualDistanceKm = calculateTraceDistanceKm(drivenTrace);

      // once they dropped off at least 200 meters early (0.2 km margin)
      if (activeMatrix && actualDistanceKm < totalTripDistance - 0.2) {
        const proratedFare = calculateDirectFare(
          actualDistanceKm,
          activeMatrix,
          isDiscountVerified,
        );

        // only apply if the prorated fare is actually cheaper
        if (proratedFare < dynamicFare) {
          setIsEarlyDropoff(true);
          setOriginalFare(dynamicFare);
          setTotalTripDistance(actualDistanceKm);
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
  ) => {
    try {
      await stopTracking();
      resetSmoothing();

      // resolve the true values: use overrides if provided immediately by Geofence, otherwise fallback to UI state
      const resolvedFare = overrideComputedFare ?? dynamicFare;
      const resolvedDistance = overrideDistance ?? totalTripDistance;

      const base = 35;
      const succeeding = Math.max(0, resolvedFare - base);
      const generatedTripId = `TRP-${Math.floor(100000 + Math.random() * 900000)}`;

      let tripStatus = "Cancelled";
      if (isForcedCancel) {
        tripStatus = "Cancelled";
      } else if (isForcedComplete || resolvedDistance >= 0.05) {
        // kapag not explicitly ended/cancelled, assume completed if they traveled at least 50 meters
        tripStatus = "Completed";
      }

      const payload = {
        trip_id: tripId,
        user: user?.id || null,
        tricycle: bodyNumber,
        fare_matrix: matrixId,
        trip_mode: parsedStopovers.length > 0 ? "Special" : "Direct",
        origin_address: originName,
        destination_address: destName,
        total_distance_km: resolvedDistance,
        computed_fare: resolvedFare,
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
          duration: `${Math.max(1, Math.ceil(initialDistance * 3))} mins`,
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

  const handleEndTrip = (askedFare?: string) => {
    // falls back to dynamicFare if no valid askedFare is provided
    const finalFareCharged =
      askedFare && !isNaN(Number(askedFare)) ? Number(askedFare) : dynamicFare;

    // execute immediately
    commitTrip(finalFareCharged, false, true, undefined, undefined);
  };

  const handleCommuterForceEnd = async () => {
    try {
      // Secure the state on the backend first
      await api.post(`/trips/${tripId}/commuter_force_end/`);

      // If successful, transition the local UI
      prepareArrival();
      setIsDriverFinished(true);

      Alert.alert(
        "Trip Ended",
        "You have manually ended the trip. Your fare has been locked to prevent overcharging.",
      );
    } catch (error) {
      console.warn("Commuter force end failed:", error);
      Alert.alert(
        "Error",
        "Could not end the trip. Please check your internet connection.",
      );
    }
  };

  const handleCancelTrip = () => {
    Alert.alert(
      "Cancel Active Trip?",
      "Are you sure you want to cancel this ride? Your driver will be notified immediately.",
      [
        { text: "Keep Riding", style: "cancel" },
        {
          text: "Cancel Trip",
          style: "destructive",
          onPress: () => commitTrip(0, true), // This sets isForcedCancel = true, updating status to 'Cancelled'
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

        // calculate actual distance driven safely
        const actualDistanceKm =
          drivenTrace && drivenTrace.length > 1
            ? calculateTraceDistanceKm(drivenTrace)
            : totalTripDistance; // Fallback to current distance if GPS hasn't fully logged yet

        // recalculate prorated fare using matrix
        let proratedFare = dynamicFare;
        if (activeMatrix) {
          proratedFare = calculateDirectFare(
            actualDistanceKm,
            activeMatrix,
            isDiscountVerified,
          );
        }

        // lock new values into state
        setTotalTripDistance(actualDistanceKm);
        setDynamicFare(proratedFare);

        Alert.alert(
          "📍 City Limits Reached",
          "You have crossed outside the Angeles City boundaries. The LGU-regulated fare ordinance no longer applies.\n\nYour tracked trip will now end and lock the official fare up to this point. Any further travel is subject to private agreement with the driver.",
          [
            {
              text: "Acknowledge & End Trip",
              style: "destructive",
              // force save the trip using the prorated fare as an immediate override!
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
    totalTripDistance,
  ]);

  return {
    router,
    tripId,
    isDriverFinished,
    fixedFare: dynamicFare,
    lockedDistance: remainingDistance,
    bodyNumber,
    destLat,
    destLng,
    waypoints,
    parsedStopovers,
    currentLocation,
    mapCenter,
    estimatedMinutes: remainingTime,
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
    isNearDestination,
    handleCommuterForceEnd,
  };
};
