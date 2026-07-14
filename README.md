# Roam

Pay-per-use WiFi hotspot platform with mobile payments and captive portal authentication.

## Architecture

```
┌─────────────┐     ┌──────────────┐      ┌─────────────┐
│   Mobile    │───▶│   Backend    │─────▶│    Edge     │
│  (Expo/RN)  │     │ (Spring Boot)│      │   (Go/Pi)   │
└─────────────┘     └──────────────┘      └─────────────┘
      │                    │                    │
   Stripe SDK        Redis + Supabase        iptables
```

- **Mobile**: React Native (Expo) - user-facing app
- **Backend**: Spring Boot - API, payments, session management
- **Edge**: Go on Raspberry Pi - captive portal, network access control

## Payment & Session Flow

```
1. User selects hotspot → sees price based on pricePerMinuteCents
2. Tap "Connect" → Stripe Payment Sheet (Apple Pay / Google Pay / Card)
3. Payment succeeds → Webhook creates session in Redis + Supabase
4. App receives session token → connects to WiFi
5. Device authenticates with captive portal using token
6. Edge validates token with backend → grants internet access
7. Session expires → iptables blocks device
```

### Key Endpoints

| Endpoint                           | Purpose                                 |
| ---------------------------------- | --------------------------------------- |
| `POST /api/payments/create-intent` | Create Stripe Payment Intent            |
| `POST /api/stripe/webhook`         | Handle payment success → create session |
| `GET /api/session/validate`        | Edge validates token                    |
| `GET /api/hotspots`                | List nearby hotspots                    |

## Development

### Quick Start

```bash
# Backend
cd backend && ./mvnw spring-boot:run

# Mobile
cd mobile && npm install && npx expo start

# Edge (on Raspberry Pi)
cd edge && go run .
```

### QuickER Start in VS Code

Prerequisite: Setup an ssh connection with the edge device (Setup ssh config to connect as `roam-edge`)

1. Open VS Code Command Palette

   Windows/Linux: `Ctrl` + `Shift` + `P`

   Mac: `Cmd` + `Shift` + `P`

2. Enter `Tasks: Run Task` -> `Start All Services`

### Environment Variables

Copy `.env.example` to `.env` in each directory. Key variables:

- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`
- `EXPO_PUBLIC_BACKEND_URL`
- `REDIS_HOST` / `SUPABASE_URL`

### Mock Mode (Expo Go)

Native modules (Stripe SDK, WiFi) don't work in Expo Go. Mock mode is enabled by default for development:

```typescript
// mobile/src/constants/env.ts
export const MOCK_MODE = __DEV__ && true;
```

This bypasses payments and WiFi connections for UI testing.

## Testing with Native Features

Stripe and WiFi require native modules. To test real payments:

1. **iOS**: Requires Apple Developer Account ($99/year)
   - Run `npx expo prebuild` then build in Xcode
2. **Android**: Works on physical device

   - Run `npx expo run:android`

3. **EAS Build**: Recommended for CI/CD
   - `eas build --platform all`

## Database

Run `backend/sql/001_schema.sql` in Supabase SQL Editor. Tables:

- `hotspots` - WiFi locations with pricing
- `transactions` - Payment records (20% platform / 80% business split)
- `wifi_sessions` - Session history

## License

See [LICENSE](LICENSE)
