import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { PendingVerificationBanner } from '@/components/common/PendingVerificationBanner';
import { CustomTabBar } from '@/components/navigation/CustomTabBar';

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <PendingVerificationBanner />
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: '#F5F7F8' },
          headerTitleStyle: { color: '#0F1E24', fontWeight: '700' },
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
          },
        }}
      >
        <Tabs.Screen
          name="discover"
          options={{
            title: 'Home',
          }}
        />
        <Tabs.Screen
          name="likes"
          options={{
            title: 'Saved',
            tabBarBadge: '',
          }}
        />
        <Tabs.Screen
          name="matches"
          options={{
            title: 'Inquiries',
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
          }}
        />
      </Tabs>
    </View>
  );
}
