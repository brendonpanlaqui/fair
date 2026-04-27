require("dotenv/config");

module.exports = {
  expo: {
    name: "fair",
    slug: "fair-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "fair-app",
    userInterfaceStyle: "automatic",
    platforms: ["android"],
    ios: {
      supportsTablet: true,
      infoPlist: {
        UIBackgroundModes: ["location", "fetch"],
      },
    },
    android: {
      package: "com.brendonpanlaqui.fairapp",
      adaptiveIcon: {
        backgroundColor: "#d32f2f",
        foregroundImage: "./assets/images/adaptive-icon.png",
      },
      predictiveBackGestureEnabled: false,
      softwareKeyboardLayoutMode: "resize",
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_LOCATION",
        "POST_NOTIFICATIONS",
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
          backgroundColor: "#FFFFFF",
        },
      ],
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
