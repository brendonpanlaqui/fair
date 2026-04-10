import { Stack } from "expo-router";

export default function MenuLayout() {
  return (
    <Stack>
      <Stack.Screen name="give-feedback" options={{ headerShown: false }} />
      <Stack.Screen name="help-support" options={{ headerShown: false }} />
      <Stack.Screen name="ordinance" options={{ headerShown: false }} />
      <Stack.Screen name="saved-places" options={{ headerShown: false }} />
      <Stack.Screen name="verify-id" options={{ headerShown: false }} />
    </Stack>
  );
}
