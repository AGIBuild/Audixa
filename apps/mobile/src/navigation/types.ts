import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

/**
 * Tab navigator param list
 */
export type TabParamList = {
  Library: undefined;
  Listening: undefined;
  Vocabulary: undefined;
  Settings: undefined;
};

/**
 * Root stack param list
 */
export type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList>;
  Player: { sourceId: string };
  SubtitleSearch: { mediaPath: string };
};

/**
 * Screen props for tab screens
 */
export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

/**
 * Screen props for stack screens
 */
export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
