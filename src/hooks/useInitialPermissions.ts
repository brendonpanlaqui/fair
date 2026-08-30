// src/hooks/useInitialPermissions.ts
import { Camera } from "expo-camera";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";

export const useInitialPermissions = () => {
  useEffect(() => {
    const requestAllPermissions = async () => {
      try {
        // 1. Location (Crucial for the map on HomeScreen)
        const locationStatus = await Location.getForegroundPermissionsAsync();
        if (!locationStatus.granted) {
          await Location.requestForegroundPermissionsAsync();
        }

        // 2. Camera (For the report form)
        const cameraStatus = await Camera.getCameraPermissionsAsync();
        if (!cameraStatus.granted) {
          await Camera.requestCameraPermissionsAsync();
        }

        // 3. Microphone (For video evidence)
        const micStatus = await Camera.getMicrophonePermissionsAsync();
        if (!micStatus.granted) {
          await Camera.requestMicrophonePermissionsAsync();
        }

        // 4. Notifications (For driver alerts and trip updates)
        const notificationStatus = await Notifications.getPermissionsAsync();
        if (!notificationStatus.granted) {
          await Notifications.requestPermissionsAsync({
            ios: {
              allowAlert: true,
              allowBadge: true,
              allowSound: true,
            },
          });
        }
      } catch (error) {
        console.warn("Error requesting initial permissions:", error);
      }
    };

    requestAllPermissions();
  }, []);
};
