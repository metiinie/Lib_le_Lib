import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetwork } from '@/hooks/useNetwork';

export function OfflineBanner() {
  const { isOnline } = useNetwork();

  if (isOnline) return null;

  return (
    <View className="bg-slate-900 px-4 py-2 flex-row items-center justify-center z-50">
      <Ionicons name="cloud-offline" size={16} color="#fbbf24" />
      <Text className="text-amber-400 font-semibold text-xs ml-2">
        You are offline. Actions will sync when reconnected.
      </Text>
    </View>
  );
}
