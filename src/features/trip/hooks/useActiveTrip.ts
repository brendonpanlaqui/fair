import { isWithinAngelesCity } from "@/src/utils/geofencing";
import { resetSmoothing } from "@/src/utils/gpsSmoothing";
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
  const { currentLocation, drivenTrace, stopTracking } =
    useLocationTracking(true);
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
  const [hasLeftCity, setHasLeftCity] = useState(false);

  // 4. Handlers
  const handleSecretDeviationTrigger = () => {
    setSecretTapCount((prev) => prev + 1);
    if (secretTapCount >= 2) {
      setIsDeviationWarningVisible(true);
      setSecretTapCount(0);
    }
  };

  // 🚀 EXTRACTED: Reusable commit logic for both manual ending and out-of-bounds auto-ending
  const commitTrip = async (
    finalFareCharged: number,
    isForcedCancel: boolean = false,
  ) => {
    try {
      await stopTracking();
      resetSmoothing(); // clear GPS smoothing history for the next trip

      const base = 35;
      const succeeding = Math.max(0, fixedFare - base);
      const generatedTripId = `TRP-${Math.floor(100000 + Math.random() * 900000)}`;

      // Determine if the trip was actually taken by checking if a real map trace was generated
      const tripStatus = isForcedCancel
        ? "Cancelled"
        : drivenTrace.length >= 3
          ? "Completed"
          : "Cancelled";

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
        actual_fare_charged: tripStatus === "Completed" ? finalFareCharged : 0,
        discount_applied: 0.0,
        status: tripStatus,
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
      console.log("\n--- API ERROR ---");
      console.log(
        JSON.stringify(error.response?.data || error.message, null, 2),
      );

      let errorTitle = "Trip Save Failed";
      let errorMessage =
        "Something went wrong while saving your trip. Please try again.";

      // Handle generic DRF detail errors or Fare Matrix issues
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.fare_matrix) {
          errorTitle = "Invalid Fare Matrix";
          errorMessage =
            "There is an issue with the selected fare matrix. Please try again.";
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
      }
      // Check if it's a network issue (no internet)
      else if (
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

  // 🚀 UPDATED: Accepting the askedFare from the UI
  const handleEndTrip = (askedFare?: string) => {
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
          onPress: () => commitTrip(finalFareCharged),
        },
      ],
    );
  };

  // 🚀 NATIVE BACK CANCELLATION HANDLER
  const handleCancelTrip = () => {
    Alert.alert(
      "Cancel Tracking?",
      "If you stop tracking now, this trip will be marked as Cancelled in your history.",
      [
        { text: "Keep Riding", style: "cancel" },
        {
          text: "Stop Tracking",
          style: "destructive",
          onPress: () => commitTrip(0, true), // Force save as Cancelled with ₱0 fare
        },
      ],
    );
  };

  const handleReportDeviation = async () => {
    setIsDeviationWarningVisible(false);
    await stopTracking();
    resetSmoothing(); // clear GPS smoothing history
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

  // 🚀 SENIOR SWE ADDITION: Real-time Geofencing Boundary Check
  useEffect(() => {
    if (currentLocation && !hasLeftCity) {
      if (
        !isWithinAngelesCity(
          currentLocation.latitude,
          currentLocation.longitude,
        )
      ) {
        setHasLeftCity(true);
        Alert.alert(
          "📍 City Limits Reached",
          "You have crossed outside the Angeles City boundaries. The LGU-regulated fare ordinance no longer applies.\n\nYour tracked trip will now end and lock the official fare up to this point. Any further travel is subject to private agreement with the driver.",
          [
            {
              text: "Acknowledge & End Trip",
              style: "destructive",
              onPress: () => commitTrip(fixedFare), // Lock the LGU portion automatically
            },
          ],
          { cancelable: false }, // Forces the user to click acknowledge
        );
      }
    }
  }, [currentLocation, hasLeftCity]);

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
    handleCancelTrip,
    handleReportDeviation,
    stopTracking,
  };
};
