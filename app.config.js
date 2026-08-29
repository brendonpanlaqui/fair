require("dotenv/config");

module.exports = {
  expo: {
    extra: {
      eas: {
        projectId: "384baf46-d97e-4fba-a3aa-3424e504ba0d",
      },
    },
    name: "fair",
    slug: "fair-app",
    version: "1.0.1",
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
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
      versionCode: 2,
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
        "CAMERA",
        "RECORD_AUDIO",
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
      [
        "expo-camera",
        {
          cameraPermission:
            "Allow Fair to access your camera to report tricycles.",
          microphonePermission:
            "Allow Fair to access your microphone to record video evidence.",
          recordAudioAndroid: true,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
};
