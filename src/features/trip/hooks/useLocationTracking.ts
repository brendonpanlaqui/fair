import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import {
  AppState,
  AppStateStatus,
  PermissionsAndroid,
  Platform,
} from "react-native";
import { BACKGROUND_TRIP_TASK } from "../services/BackgroundLocationService";

export const useLocationTracking = () => {
  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObjectCoords | null>(null);
  const [drivenTrace, setDrivenTrace] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state with what the background task recorded while minimized
  const syncBackgroundData = async () => {
    try {
      const storedTrace = await AsyncStorage.getItem("bg_driven_trace");
      if (storedTrace) {
        setDrivenTrace(JSON.parse(storedTrace));
      }
    } catch (e) {
      console.error("Failed to sync background trace", e);
    }
  };

  const stopTracking = async () => {
    const hasStarted =
      await Location.hasStartedLocationUpdatesAsync(BACKGROUND_TRIP_TASK);
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_TRIP_TASK);
    }
    await AsyncStorage.removeItem("bg_driven_trace");
    await AsyncStorage.removeItem("bg_latest_location");
  };

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      if (Platform.OS === "android" && Platform.Version >= 33) {
        const notifStatus = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        if (notifStatus !== PermissionsAndroid.RESULTS.GRANTED) {
          console.warn(
            "Notification permission denied! Background task might fail.",
          );
        }
      }
      const { status: fgStatus } =
        await Location.requestForegroundPermissionsAsync();
      if (fgStatus !== "granted") {
        setErrorMsg("Foreground permission denied");
        return;
      }

      const { status: bgStatus } =
        await Location.requestBackgroundPermissionsAsync();
      if (bgStatus !== "granted") {
        setErrorMsg(
          "Background permission denied. Trip won't track when minimized.",
        );
      }

      // 2. Clear old storage just in case
      await AsyncStorage.removeItem("bg_driven_trace");

      try {
        // 3. Start Background Tracking (Runs when app is minimized)
        if (bgStatus === "granted") {
          await Location.startLocationUpdatesAsync(BACKGROUND_TRIP_TASK, {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 5000,
            distanceInterval: 10,
            showsBackgroundLocationIndicator: true, // Shows the blue pill/notification on iOS/Android
            foregroundService: {
              notificationTitle: "Fair Trip Active",
              notificationBody: "Tracking your route in the background.",
              notificationColor: "#D32F2F",
            },
          });
        }

        // 4. Start Foreground Tracking (Runs when app is open)
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
              const newPoint = { latitude, longitude };

              setDrivenTrace((prev) => {
                const updated = [...prev, newPoint];
                // Also mirror to AsyncStorage so the background task has the latest array
                AsyncStorage.setItem(
                  "bg_driven_trace",
                  JSON.stringify(updated),
                ).catch(() => {});
                return updated;
              });
            }
          },
        );
      } catch (error) {
        setErrorMsg("Failed to start location tracking");
      }
    };

    startTracking();

    // 5. Listen for App State changes (Minimized <-> Active)
    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState === "active") {
          // When user opens app, pull whatever the background task saved
          syncBackgroundData();
        }
      },
    );

    return () => {
      if (locationSubscription) locationSubscription.remove();
      appStateSubscription.remove();
      // NOTE: We DO NOT call stopTracking() here, or minimizing the app kills it!
    };
  }, []);

  return {
    currentLocation,
    drivenTrace,
    errorMsg,
    stopTracking, // 🚀 Export this to trigger when the trip ends!
  };
};
