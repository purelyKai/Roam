import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";

export type RootBottomTabParamList = {
  HomeTab: undefined;
  ElapsedTimeTab: undefined;
};

export type HomeTabScreenProps = BottomTabScreenProps<
  RootBottomTabParamList,
  "HomeTab"
>;

export type ElapsedTimeTabScreenProps = BottomTabScreenProps<
  RootBottomTabParamList,
  "ElapsedTimeTab"
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootBottomTabParamList {}
  }
}
