# Roam Mobile App 📱

This is the mobile app for Roam, built with [Expo](https://expo.dev) and React Native using React Navigation.

## Project Structure

```
mobile/
├── src/                       # All source code
│   ├── App.tsx                # App entry point with NavigationContainer
│   ├── assets/                # Static assets (images, fonts, etc.)
│   │   └── images/
│   │       └── logo.png
│   ├── components/            # Reusable UI components
│   │   ├── index.ts           # Barrel export
│   │   ├── BusinessModal.tsx
│   │   └── TopBar.tsx
│   ├── constants/             # App-wide constants
│   │   └── index.ts
│   ├── hooks/                 # Custom React hooks
│   │   ├── index.ts
│   │   └── getPins.ts
│   ├── navigation/            # React Navigation setup
│   │   ├── index.ts           # Barrel export
│   │   ├── RootNavigator.tsx  # Stack navigator
│   │   └── types.ts           # Navigation types
│   ├── screens/               # Screen components
│   │   ├── index.ts           # Barrel export
│   │   ├── HomeScreen.tsx
│   │   └── ElapsedTimeScreen.tsx
│   ├── types/                 # TypeScript type definitions
│   │   └── index.ts
│   └── utils/                 # Utility functions
│       ├── index.ts
│       └── stripeCheckout.ts
├── app.config.ts              # Expo configuration
├── package.json               # Dependencies
└── tsconfig.json              # TypeScript configuration
```

## Navigation

This app uses [React Navigation](https://reactnavigation.org/) with Native Stack Navigator:

```typescript
// Navigate to a screen
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/src/navigation/types";

const navigation =
  useNavigation<NativeStackNavigationProp<RootStackParamList>>();
navigation.navigate("ElapsedTime");
navigation.goBack();
```

### Available Screens

- `Home` - Main map screen
- `ElapsedTime` - Active session timer screen

## Import Aliases

The project uses the `@/` path alias configured in `tsconfig.json`:

```typescript
// Import from src directory
import { TopBar, BusinessModal } from "@/src/components";
import { HomeScreen, ElapsedTimeScreen } from "@/src/screens";
import { RootNavigator } from "@/src/navigation";
import useGetPins from "@/src/hooks/getPins";
import { Checkout } from "@/src/utils";
import { COLORS, STORAGE_KEYS } from "@/src/constants";
```

## Get Started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a:

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

## Development

All source code is located in the `src/` directory:

- **src/App.tsx** - App entry point with NavigationContainer
- **src/navigation/** - React Navigation configuration
- **src/screens/** - Screen components
- **src/components/** - Reusable UI components
- **src/hooks/** - Custom React hooks
- **src/utils/** - Utility/helper functions
- **src/constants/** - App-wide constants
- **src/types/** - TypeScript type definitions
- **src/assets/** - Images, fonts, and other static assets

## Learn More

- [Expo documentation](https://docs.expo.dev/)
- [React Navigation documentation](https://reactnavigation.org/)
- [React Native documentation](https://reactnative.dev/)

## Join the Community

- [Expo on GitHub](https://github.com/expo/expo)
- [Discord community](https://chat.expo.dev)
