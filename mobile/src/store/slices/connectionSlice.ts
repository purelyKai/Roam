/**
 * Connection State - Redux slice for managing WiFi session state
 *
 * Note: WiFi credentials (ssid, password) are accessed via connectedHotspot
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Hotspot } from "@/src/hooks/useHotspots";

interface ConnectionState {
  isActive: boolean;
  connectedHotspot: Hotspot | null;
  sessionToken: string | null;
  expiryTime: number | null;
  durationMinutes: number;
  connectionStartTime: number | null;
  paymentIntentId: string | null;
}

const initialState: ConnectionState = {
  isActive: false,
  connectedHotspot: null,
  sessionToken: null,
  expiryTime: null,
  durationMinutes: 0,
  connectionStartTime: null,
  paymentIntentId: null,
};

interface ConnectPayload {
  hotspot: Hotspot;
  sessionToken: string;
  expiresAt: number;
  durationMinutes: number;
  paymentIntentId?: string;
}

interface ExtendPayload {
  additionalMinutes: number;
  newExpiresAt: number;
}

const connectionSlice = createSlice({
  name: "connection",
  initialState,
  reducers: {
    connect: (state, action: PayloadAction<ConnectPayload>) => {
      const {
        hotspot,
        sessionToken,
        expiresAt,
        durationMinutes,
        paymentIntentId,
      } = action.payload;
      state.isActive = true;
      state.connectedHotspot = hotspot;
      state.sessionToken = sessionToken;
      state.expiryTime = expiresAt;
      state.durationMinutes = durationMinutes;
      state.connectionStartTime = Date.now();
      state.paymentIntentId = paymentIntentId || null;
    },

    disconnect: (state) => {
      state.isActive = false;
      state.connectedHotspot = null;
      state.sessionToken = null;
      state.expiryTime = null;
      state.durationMinutes = 0;
      state.connectionStartTime = null;
      state.paymentIntentId = null;
    },

    extendSession: (state, action: PayloadAction<ExtendPayload>) => {
      if (state.isActive) {
        state.durationMinutes += action.payload.additionalMinutes;
        state.expiryTime = action.payload.newExpiresAt;
      }
    },

    sessionExpired: (state) => {
      state.isActive = false;
      state.connectedHotspot = null;
      state.sessionToken = null;
      state.expiryTime = null;
      state.durationMinutes = 0;
      state.connectionStartTime = null;
      state.paymentIntentId = null;
    },

    /**
     * Update session token after re-authentication.
     */
    updateSessionToken: (
      state,
      action: PayloadAction<{ sessionToken: string; expiresAt: number }>
    ) => {
      if (state.isActive) {
        state.sessionToken = action.payload.sessionToken;
        state.expiryTime = action.payload.expiresAt;
      }
    },
  },
});

export const {
  connect,
  disconnect,
  extendSession,
  sessionExpired,
  updateSessionToken,
} = connectionSlice.actions;

export default connectionSlice.reducer;
