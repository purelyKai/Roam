# Roam Mobile App 📱

This is the mobile app for Roam, built with [Expo](https://expo.dev) and React Native.

## Project Structure

```
mobile/
├── src/                       # All source code lives here
│   ├── app/                   # Expo Router - file-based routing
│   │   ├── _layout.tsx        # Root layout
│   │   ├── index.tsx          # Entry redirect
│   │   ├── home/              # Home screen
│   │   │   └── index.tsx
│   │   └── pages/             # Additional pages
│   │       └── ElapsedTime.tsx
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
│   ├── types/                 # TypeScript type definitions
│   │   └── index.ts
│   └── utils/                 # Utility functions
│       ├── index.ts
│       └── stripeCheckout.ts
├── app.json                   # Expo configuration
├── package.json               # Dependencies
└── tsconfig.json              # TypeScript configuration
```

## Import Aliases

The project uses the `@/` path alias configured in `tsconfig.json`:

```typescript
// Import from src directory
import { TopBar, BusinessModal } from "@/src/components";
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

- **src/app/** - Contains all route files. This project uses [Expo Router file-based routing](https://docs.expo.dev/router/introduction).
- **src/components/** - Add reusable UI components here
- **src/hooks/** - Add custom React hooks here
- **src/utils/** - Add utility/helper functions here
- **src/constants/** - Add app-wide constants here
- **src/types/** - Add TypeScript type definitions here
- **src/assets/** - Add images, fonts, and other static assets here

## Configuration

The app directory is configured in `app.json`:

```json
{
  "plugins": [
    [
      "expo-router",
      {
        "root": "./src/app"
      }
    ]
  ]
}
```

## Learn More

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router documentation](https://docs.expo.dev/router/introduction/)
- [React Native documentation](https://reactnative.dev/)

## Join the Community

- [Expo on GitHub](https://github.com/expo/expo)
- [Discord community](https://chat.expo.dev)
