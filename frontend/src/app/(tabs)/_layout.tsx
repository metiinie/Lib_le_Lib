import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PendingVerificationBanner } from '@/components/common/PendingVerificationBanner';

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <PendingVerificationBanner />
      <Tabs
        screenOptions={{
          headerShown: true,
          tabBarActiveTintColor: '#C4623A',
          tabBarInactiveTintColor: '#4A7A8A',
          tabBarStyle: {
            borderTopWidth: 1,
            borderTopColor: '#1B3D48',
          },
        }}
      >
        <Tabs.Screen
          name="discover"
          options={{
            title: 'Discover',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="compass-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="likes"
          options={{
            title: 'Likes',
            tabBarBadge: '', // Renders a red dot for new likes
            tabBarBadgeStyle: { minWidth: 10, maxHeight: 10, borderRadius: 5, backgroundColor: '#C4623A' },
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="star-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="matches"
          options={{
            title: 'Matches',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbubble-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
