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

import { AuthProvider, useAuth } from "@/src/hooks/AuthContext";
import { useColorScheme } from "@/src/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(tabs)",
};

const InitialLayout = () => {
  const { user, isGuest, loading } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();

  // 🚀 THE UPGRADE: useSegments tells us exactly which folder the user is currently inside
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    // 🛡️ THE NEW SHIELD: If the first folder in the path is (auth), they are in the auth group!
    // This automatically protects /otp, /forgot-password, /verify-id without needing to list them.
    const inAuthGroup = segments[0] === "(auth)";
    const isAllowedAccess = user || isGuest;

    if (!isAllowedAccess && !inAuthGroup) {
      // Kick them to the login screen
      router.replace("/auth");
    } else if (isAllowedAccess && inAuthGroup) {
      // They are logged in but trying to view login pages -> send to dashboard
      router.replace("/(tabs)");
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
