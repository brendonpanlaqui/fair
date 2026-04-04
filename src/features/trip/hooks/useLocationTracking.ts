import * as Location from "expo-location";
import { useEffect, useState } from "react";

export const useLocationTracking = () => {
  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObjectCoords | null>(null);
  const [drivenTrace, setDrivenTrace] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      try {
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 3000,
            distanceInterval: 5,
          },
          (location) => {
            const { accuracy, latitude, longitude } = location.coords;

            if (accuracy && accuracy <= 500) {
              setCurrentLocation(location.coords);

              // 🚀 1. ADD THIS: Push every valid coordinate into the breadcrumb array
              setDrivenTrace((prev) => [...prev, { latitude, longitude }]);
            } else {
              console.log(
                `⚠️ Ignored garbage GPS ping. Accuracy was off by ${accuracy} meters.`,
              );
            }
          },
        );
      } catch (error) {
        setErrorMsg("Failed to start location tracking");
      }
    };

    startTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  return {
    currentLocation,
    drivenTrace, // 🚀 2. Make sure this is exported so useActiveTrip can grab it!
    errorMsg,
  };
};
