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
  onTripCancelled,
}: {
  onTripApproved?: () => void;
  onTripCancelled?: () => void;
} = {}) => {
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
            bodyText || "A passenger wants to book a ride with you.",
            [
              {
                text: "Reject",
                style: "cancel",
                onPress: async () => {
                  try {
                    // the driver said NO
                    await api.post(`/trips/${data.trip_id}/decline/`);

                    Alert.alert("Trip Rejected", "Ride request cancelled.");
                  } catch (error) {
                    Alert.alert(
                      "Error",
                      "Failed to decline the trip. Please try again.",
                    );
                    console.error("Failed to decline trip:", error);
                  }
                },
              },
              {
                text: "Accept",
                style: "default",
                onPress: async () => {
                  try {
                    // the driver said YES
                    await api.post(`/trips/${data.trip_id}/approve/`);

                    if (onTripApproved) {
                      onTripApproved();
                    }

                    Alert.alert(
                      "Ride Accepted!",
                      "The passenger has been notified. Biyahe na and drive safely!",
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
        } else if (data?.type === "TRIP_CANCELLED") {
          Alert.alert(
            "Trip Cancelled ⚠️",
            bodyText || "The passenger has cancelled the current trip.",
            [{ text: "OK", style: "default" }],
          );

          if (onTripCancelled) {
            onTripCancelled();
          }
        }
      },
    );

    // clean up the listener when the component unmounts
    return () => subscription.remove();
  }, [onTripApproved, onTripCancelled]); // Add the callback to the dependency array
};
