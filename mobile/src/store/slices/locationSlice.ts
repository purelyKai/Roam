import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import * as Location from "expo-location";

interface LocationState {
  current: Location.LocationObject | null;
}

const initialState: LocationState = {
  current: null,
};

const initializeLocation = createAsyncThunk(
  "location/initialize",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return rejectWithValue("Permission to access location was denied");
      }

      const initialLocation = await Location.getCurrentPositionAsync({});
      dispatch(setLocation(initialLocation));
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to get location"
      );
    }
  }
);

const locationSlice = createSlice({
  name: "location",
  initialState,
  reducers: {
    setLocation: (state, action: PayloadAction<Location.LocationObject>) => {
      state.current = action.payload;
    },
  },
});

export { initializeLocation };
export const { setLocation } = locationSlice.actions;
export default locationSlice.reducer;
