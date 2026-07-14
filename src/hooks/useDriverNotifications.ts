import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Alert } from "react-native";
import { api } from "../services/api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Add an options object to accept callbacks from the component
export const useDriverNotifications = ({
  onTripApproved,
}: { onTripApproved?: () => void } = {}) => {
  const router = useRouter();

  useEffect(() => {
    // listen for incoming foreground push notifications
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        // this 'data' object matches the payload we designed in the Django view
        const data = notification.request.content.data;
        const bodyText = notification.request.content.body;

        if (data?.type === "TRIP_REQUEST") {
          Alert.alert(
            "New Passenger Request",
            bodyText || "A commuter wants to link to your tricycle.",
            [
              {
                text: "Decline",
                style: "cancel",
                onPress: async () => {
                  try {
                    // the driver said NO
                    await api.post(`/trips/${data.trip_id}/decline/`);
                  } catch (error) {
                    console.error("Failed to decline trip:", error);
                  }
                },
              },
              {
                text: "Approve",
                style: "default",
                onPress: async () => {
                  try {
                    // the driver said YES
                    await api.post(`/trips/${data.trip_id}/approve/`);

                    // 👉 TRIGGER THE DASHBOARD UPDATE HERE
                    if (onTripApproved) {
                      onTripApproved();
                    }

                    Alert.alert(
                      "Trip Linked!",
                      "The passenger has been notified. Drive safely!",
                    );
                  } catch (error) {
                    Alert.alert(
                      "Error",
                      "Failed to approve trip. Please check your connection.",
                    );
                    console.error("Failed to approve trip:", error);
                  }
                },
              },
            ],
          );
        }
      },
    );

    // clean up the listener when the component unmounts
    return () => subscription.remove();
  }, [onTripApproved]); // Add the callback to the dependency array
};
