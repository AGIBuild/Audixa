import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LibraryScreen } from '../screens/LibraryScreen';
import { ListeningScreen } from '../screens/ListeningScreen';
import { VocabularyScreen } from '../screens/VocabularyScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { TabBarIcon } from '../components/atoms/TabBarIcon';
import { colors, layoutSizes } from '@audixa/ui';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgPanel,
          borderTopColor: colors.border,
          height: layoutSizes.bottomTabHeight,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDim,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{
          tabBarLabel: 'Library',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="library" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Listening"
        component={ListeningScreen}
        options={{
          tabBarLabel: 'Listening',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="listening" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Vocabulary"
        component={VocabularyScreen}
        options={{
          tabBarLabel: 'Vocabulary',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="vocabulary" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="settings" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
