import { useAuth } from "@/src/hooks/AuthContext"; // Import Auth Context
import * as Location from "expo-location";
import { useEffect } from "react";
import { api } from "../../../services/api";

export const useDriverLocationStream = (isOnline: boolean) => {
  const { user } = useAuth();

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    // --- STRICT ROLE GUARD ---
    // If the user is NOT a Driver, or they are offline, stop execution instantly.
    // This prevents Commuters from triggering the 403 error.
    if (user?.user_type !== "Driver" || !isOnline) {
      return;
    }

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Driver denied location permissions for streaming.");
        return;
      }

      // Watches the driver's GPS location live and reports back on movement
      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 15000, // Trigger every 15 seconds
          distanceInterval: 10, // Or every 10 meters changed
        },
        async (location) => {
          try {
            await api.post("/driver/location/update/", {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
            console.log("Driver location streamed successfully.");
          } catch (error) {
            // Use debug instead of error so it doesn't flash red in the console during normal connectivity drops
            console.debug("Failed to stream driver location:", error);
          }
        },
      );
    };

    startTracking();

    // Clean up tracking when the driver goes offline, logs out, or component unmounts
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [isOnline, user?.user_type]); // Add user_type to the dependency array
};
