import { getSmoothedLocation } from "@/src/utils/gpsSmoothing";
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

// tell that we are actually in a trip
export const useLocationTracking = (isTripActive: boolean = false) => {
  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObjectCoords | null>(null);
  const [drivenTrace, setDrivenTrace] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      // aggressive permission to ensure background tracking in active trips
      if (isTripActive && Platform.OS === "android" && Platform.Version >= 33) {
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

      try {
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown) {
          setCurrentLocation(lastKnown.coords);
        }
      } catch (e) {
        console.log("No cached location available");
      }

      try {
        // start background tracking if we are in an active trip
        if (isTripActive) {
          const { status: bgStatus } =
            await Location.requestBackgroundPermissionsAsync();
          if (bgStatus !== "granted") {
            setErrorMsg(
              "Background permission denied. Trip won't track when minimized.",
            );
          }

          await AsyncStorage.removeItem("bg_driven_trace");

          if (bgStatus === "granted") {
            await Location.startLocationUpdatesAsync(BACKGROUND_TRIP_TASK, {
              accuracy: Location.Accuracy.BestForNavigation,
              timeInterval: 5000,
              distanceInterval: 10,
              showsBackgroundLocationIndicator: true,
              foregroundService: {
                notificationTitle: "Fair Trip Active",
                notificationBody: "Tracking your route in the background.",
                notificationColor: "#D32F2F",
              },
            });
          }
        } else {
          // if we are just on the home screen, make absolutely sure no zombie tasks are running
          const hasStarted =
            await Location.hasStartedLocationUpdatesAsync(BACKGROUND_TRIP_TASK);
          if (hasStarted) {
            await Location.stopLocationUpdatesAsync(BACKGROUND_TRIP_TASK);
          }
        }

        // foreground tracking (Runs on ALL screens to show the map)
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 3000,
            distanceInterval: 5,
          },
          (location) => {
            const { accuracy, latitude, longitude } = location.coords;
            // only process reasonably accurate GPS signals to avoid large jumps
            if (accuracy && accuracy <= 50) {
              // 1. Pass the raw GPS coordinates through the smoother
              const smoothedLocation = getSmoothedLocation(latitude, longitude);

              // update the current location with the smoothed value for a stable map dot
              const smoothedCoords = {
                ...location.coords,
                latitude: smoothedLocation.lat,
                longitude: smoothedLocation.lng,
              };
              setCurrentLocation(smoothedCoords);

              // only record the trace if we are actively in a trip
              if (isTripActive) {
                setDrivenTrace((prev) => {
                  // save the smoothed coordinates to your polyline trace state
                  const updated = [
                    ...prev,
                    {
                      latitude: smoothedLocation.lat,
                      longitude: smoothedLocation.lng,
                    },
                  ];
                  AsyncStorage.setItem(
                    "bg_driven_trace",
                    JSON.stringify(updated),
                  ).catch(() => {});
                  return updated;
                });
              }
            }
          },
        );
      } catch (error) {
        setErrorMsg("Failed to start location tracking");
      }
    };

    startTracking();

    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState === "active" && isTripActive) {
          syncBackgroundData();
        }
      },
    );

    return () => {
      if (locationSubscription) locationSubscription.remove();
      appStateSubscription.remove();
    };
  }, [isTripActive]); // 🚀 Add dependency

  return {
    currentLocation,
    drivenTrace,
    errorMsg,
    stopTracking,
  };
};
