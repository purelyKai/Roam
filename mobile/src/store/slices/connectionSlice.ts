import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Pin } from "@/src/hooks";

interface ConnectionState {
  isActive: boolean;
  connectedPin: Pin | null;
  connectionStartTime: number | null;
  connectionDuration: number; // minutes
  expiryTime: number | null;
}

const initialState: ConnectionState = {
  isActive: false,
  connectedPin: null,
  connectionStartTime: null,
  connectionDuration: 0,
  expiryTime: null,
};

const connectionSlice = createSlice({
  name: "connection",
  initialState,
  reducers: {
    connect: (state, action: PayloadAction<{ pin: Pin; duration: number }>) => {
      const now = Date.now();
      state.isActive = true;
      state.connectedPin = action.payload.pin;
      state.connectionStartTime = now;
      state.connectionDuration = action.payload.duration;
      state.expiryTime = now + action.payload.duration * 60 * 1000;
    },
    disconnect: (state) => {
      state.isActive = false;
      state.connectedPin = null;
      state.connectionStartTime = null;
      state.connectionDuration = 0;
      state.expiryTime = null;
    },
    extendConnection: (
      state,
      action: PayloadAction<{ additionalDuration: number }>
    ) => {
      if (state.isActive && state.expiryTime) {
        state.connectionDuration += action.payload.additionalDuration;
        state.expiryTime += action.payload.additionalDuration * 60 * 1000;
      }
    },
  },
});

export const { connect, disconnect, extendConnection } =
  connectionSlice.actions;
export default connectionSlice.reducer;
