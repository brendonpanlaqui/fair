import * as Location from "expo-location";
import { useEffect, useState } from "react";

export const useLocationTracking = () => {
  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObjectCoords | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      // 1. Request Permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      try {
        // 2. Continuously WATCH the position instead of just getting it once
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High, // 🚀 High accuracy needed for strict deviation checking
            timeInterval: 3000, // 🚀 Update every 3 seconds
            distanceInterval: 5, // 🚀 Or update every 5 meters moved
          },
          (location) => {
            // Every time the phone moves 5 meters or 3 seconds pass, this runs!
            setCurrentLocation(location.coords);
          },
        );
      } catch (error) {
        setErrorMsg("Failed to start location tracking");
      }
    };

    startTracking();

    // 3. CRITICAL: Cleanup function.
    // This stops the GPS from draining the battery after the user clicks "End Trip"
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  return {
    currentLocation,
    errorMsg,
  };
};
