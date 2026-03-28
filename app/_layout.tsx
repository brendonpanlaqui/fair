import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, usePathname, useRouter } from "expo-router";
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
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    // 1. THIS IS THE SHIELD: It must include forgot-password!
    const inAuthGroup =
      pathname === "/auth" ||
      pathname === "/otp" ||
      pathname === "/forgot-password";

    const isAllowedAccess = user || isGuest;

    if (!isAllowedAccess && !inAuthGroup) {
      router.replace("/auth");
    } else if (isAllowedAccess && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [user, isGuest, loading, pathname]);

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
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="otp" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        <Stack.Screen
          name="verify-id"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen name="ordinance" options={{ headerShown: false }} />
        <Stack.Screen
          name="dispute-guidelines"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="saved-places" options={{ headerShown: false }} />
        <Stack.Screen name="help-support" options={{ headerShown: false }} />
        <Stack.Screen name="give-feedback" options={{ headerShown: false }} />
        <Stack.Screen
          name="start-trip"
          options={{
            presentation: "modal",
            headerTitle: "Setup Ride",
            headerShown: true,
          }}
        />
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
