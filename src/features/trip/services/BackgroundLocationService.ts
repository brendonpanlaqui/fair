import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

export const BACKGROUND_TRIP_TASK = "BACKGROUND_TRIP_TASK";

// 🚀 FIX: Added explicit types to { data, error } to satisfy strict TypeScript rules
TaskManager.defineTask(
  BACKGROUND_TRIP_TASK,
  async ({ data, error }: { data: any; error: any }) => {
    if (error) {
      console.log("⚠️ Background Location Error:", error.message);
      return;
    }

    if (data) {
      const { locations } = data as { locations: Location.LocationObject[] };

      console.log(
        `[BACKGROUND] Pinging from minimized app! Lat: ${locations[0].coords.latitude}`,
      );

      try {
        // 1. Fetch the existing trace from storage
        const existingTraceStr = await AsyncStorage.getItem("bg_driven_trace");
        const existingTrace = existingTraceStr
          ? JSON.parse(existingTraceStr)
          : [];

        // 2. Extract new valid points
        const newPoints = locations
          .filter((loc) => loc.coords.accuracy && loc.coords.accuracy <= 500)
          .map((loc) => ({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          }));

        if (newPoints.length > 0) {
          // 3. Save the merged trace back to storage
          const updatedTrace = [...existingTrace, ...newPoints];
          await AsyncStorage.setItem(
            "bg_driven_trace",
            JSON.stringify(updatedTrace),
          );

          // Save latest location for quick access
          await AsyncStorage.setItem(
            "bg_latest_location",
            JSON.stringify(newPoints[newPoints.length - 1]),
          );
        }
      } catch (e) {
        console.error("Failed to save background location", e);
      }
    }
  },
);
