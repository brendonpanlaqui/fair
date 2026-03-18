import * as Location from "expo-location";
import { useEffect, useState } from "react";

export const useLocationTracking = () => {
  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObjectCoords | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialLocation = async () => {
      // 1. Request Android Permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      // 2. Just get the current location ONCE for the map origin
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setCurrentLocation(location.coords);
      } catch (error) {
        setErrorMsg("Failed to fetch location");
      }
    };

    fetchInitialLocation();
  }, []);

  return {
    currentLocation,
    errorMsg,
  };
};
