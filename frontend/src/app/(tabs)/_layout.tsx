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
          headerShown: false,
          headerStyle: { backgroundColor: '#F5F7F8' },
          headerTitleStyle: { color: '#0F1E24', fontWeight: '700' },
          tabBarActiveTintColor: '#1B4D5C',
          tabBarInactiveTintColor: '#6B9BAA',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E2E8F0',
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
            tabBarBadgeStyle: { minWidth: 10, maxHeight: 10, borderRadius: 5, backgroundColor: '#1B4D5C' },
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
