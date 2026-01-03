import "dotenv/config";

export default {
  expo: {
    name: "Roam",
    slug: "roam",
    version: "1.0.0",
    orientation: "portrait",
    scheme: "roam",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    icon: "./src/assets/images/logo.png",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.roam.mobile",
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "Roam uses your location to show nearby places.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "Roam uses your location to support tracking while traveling.",
        NSLocationAlwaysUsageDescription:
          "Roam needs background location access to function correctly.",
        UIBackgroundModes: ["location"],
      },
    },
    android: {
      package: "com.roam.mobile",
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
    },
    plugins: [
      [
        "expo-router",
        {
          root: "./src/app",
        },
      ],
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "Allow Roam to use your location.",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
};
