import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { RootBottomTabParamList } from "./types";
import HomeScreen from "../screens/HomeScreen";
import ElapsedTimeScreen from "../screens/ElapsedTimeScreen";

const Tab = createBottomTabNavigator<RootBottomTabParamList>();

export default function RootNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        lazy: true,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: "Home" }}
      />
      <Tab.Screen
        name="ElapsedTimeTab"
        component={ElapsedTimeScreen}
        options={{ title: "Elapsed Time" }}
      />
    </Tab.Navigator>
  );
}
