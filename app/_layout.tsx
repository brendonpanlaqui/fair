import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import "react-native-reanimated";
import "../src/features/trip/services/BackgroundLocationService";

import { AuthProvider, useAuth } from "@/src/hooks/AuthContext";
import { useColorScheme } from "@/src/hooks/use-color-scheme";
import { useDriverNotifications } from "@/src/hooks/useDriverNotifications";

export const unstable_settings = {
  anchor: "(tabs)",
};

const InitialLayout = () => {
  const { user, isGuest, loading } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const segments = useSegments();

  // run silently in the background while the app is open
  useDriverNotifications();

  useEffect(() => {
    if (loading) return;

    // check if the user is trying to access an auth page
    const inAuthGroup = segments[0] === "(auth)";
    const inDriverGroup = segments[0] === "(driver)";

    const isAllowedAccess = user || isGuest;

    if (!isAllowedAccess && !inAuthGroup) {
      // send to login
      router.replace("/auth");
    } else if (isAllowedAccess) {
      // driver tab
      if (user?.user_type === "Driver") {
        if (!inDriverGroup) {
          router.replace("/(driver)");
        }
      } else {
        // if a commuter/guest is trying to go to driver-only pages, kick them out
        if (inDriverGroup || inAuthGroup) {
          router.replace("/(tabs)");
        }
      }
    }
  }, [user, isGuest, loading, segments]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colorScheme === "dark" ? "#000000" : "#FFFFFF",
        }}
      >
        <ActivityIndicator size="large" color="#E53935" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(trip)" options={{ headerShown: false }} />
        <Stack.Screen name="(menu)" options={{ headerShown: false }} />
        <Stack.Screen name="(driver)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}
