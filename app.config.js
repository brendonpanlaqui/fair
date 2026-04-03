import "dotenv/config";

export default {
  expo: {
    name: "fair",
    slug: "fair-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "fair-app",
    userInterfaceStyle: "automatic",
    platforms: ["android"], // Focusing on Android
    ios: {
      supportsTablet: true,
      // ✨ ADDED: iOS background location tracking requirements (just in case you port to iOS later)
      infoPlist: {
        UIBackgroundModes: ["location", "fetch"],
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
      // ✨ ADDED: Foreground Service permissions required for Android background tracking
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_LOCATION",
      ],
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
      // ✨ ADDED: Expo Location Plugin to properly configure the native tracking
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "Allow Fair App to use your location to track your ride and calculate fares securely in the background.",
          isAndroidBackgroundLocationEnabled: true,
          isIosBackgroundLocationEnabled: true,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
};
