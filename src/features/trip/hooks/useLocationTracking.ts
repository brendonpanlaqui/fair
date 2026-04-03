import * as Location from "expo-location";
import { useEffect, useState } from "react";

export const useLocationTracking = () => {
  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObjectCoords | null>(null);
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
            // 🚀 BestForNavigation forces the GPS chip to stay awake and prioritize accuracy
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 3000,
            distanceInterval: 5,
          },
          (location) => {
            const { accuracy, latitude, longitude } = location.coords;

            // 🚀 THE FIX: THE ACCURACY FILTER
            // Only accept this location if the phone is 100% sure you are within a 30-meter radius.
            // Note: If you are testing deep indoors, you may need to temporarily change this to 60 or 100 to get a signal!
            if (accuracy && accuracy <= 500) {
              setCurrentLocation(location.coords);
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
    errorMsg,
  };
};
