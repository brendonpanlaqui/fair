import { Stack } from "expo-router";

export default function TripLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="start-trip"
        options={{
          presentation: "modal",
          headerTitle: "Setup Ride",
          headerShown: true,
        }}
      />
      <Stack.Screen name="active-trip" options={{ headerShown: false }} />
      <Stack.Screen name="trip-receipt" options={{ headerShown: false }} />
    </Stack>
  );
}
