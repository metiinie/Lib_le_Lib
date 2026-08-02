import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';

export default function ProfileHubScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  
  // Mock data for the current user
  const mockUser = {
    nickname: 'Alex',
    primaryPhoto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
    verificationExpiry: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days from now
  };

  const daysToExpiry = Math.ceil((mockUser.verificationExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const showExpiryWarning = daysToExpiry <= 7;

  return (
    <ScrollView className="flex-1 bg-slate-50 pt-16 px-6">
      <Text className="text-3xl font-bold text-slate-900 mb-8">Profile</Text>

      {/* User Card */}
      <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 items-center mb-6">
        <Image 
          source={{ uri: mockUser.primaryPhoto }} 
          style={{ width: 128, height: 128, borderRadius: 64, marginBottom: 16, backgroundColor: '#e2e8f0' }}
        />
        <Text className="text-2xl font-bold text-slate-900 mb-1">{mockUser.nickname}</Text>
        <View className="flex-row items-center bg-blue-50 px-3 py-1 rounded-full mt-2">
          <Ionicons name="checkmark-circle" size={16} color="#2563eb" />
          <Text className="text-blue-700 font-bold ml-1 text-xs">Verified</Text>
        </View>
      </View>

      {/* Re-verification Reminder (Non-blocking) */}
      {showExpiryWarning && (
        <TouchableOpacity 
          className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex-row items-center shadow-sm"
          onPress={() => router.push('/(onboarding)/doc-upload')}
        >
          <View className="w-10 h-10 bg-amber-100 rounded-full items-center justify-center mr-4">
            <Ionicons name="warning" size={20} color="#d97706" />
          </View>
          <View className="flex-1">
            <Text className="text-amber-900 font-bold mb-1">Verification expires soon</Text>
            <Text className="text-amber-700 text-sm">Please submit updated medical documents in {daysToExpiry} days to stay active.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#d97706" />
        </TouchableOpacity>
      )}

      {/* Navigation Options */}
      <View className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
        <TouchableOpacity 
          className="p-4 border-b border-slate-100 flex-row items-center justify-between"
          onPress={() => router.push('/profile/edit')}
        >
          <View className="flex-row items-center">
            <Ionicons name="person-outline" size={20} color="#0f172a" />
            <Text className="text-base font-semibold text-slate-900 ml-3">Edit Profile & Photos</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
        </TouchableOpacity>

        <TouchableOpacity 
          className="p-4 border-b border-slate-100 flex-row items-center justify-between"
          onPress={() => router.push('/settings')}
        >
          <View className="flex-row items-center">
            <Ionicons name="settings-outline" size={20} color="#0f172a" />
            <Text className="text-base font-semibold text-slate-900 ml-3">Preferences</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
        </TouchableOpacity>

        <TouchableOpacity 
          className="p-4 border-b border-slate-100 flex-row items-center justify-between"
          onPress={() => router.push('/settings/subscription')}
        >
          <View className="flex-row items-center">
            <Ionicons name="star-outline" size={20} color="#0f172a" />
            <Text className="text-base font-semibold text-slate-900 ml-3">Subscription</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
        </TouchableOpacity>

        <TouchableOpacity 
          className="p-4 flex-row items-center justify-between"
          onPress={() => router.push('/support')}
        >
          <View className="flex-row items-center">
            <Ionicons name="heart-outline" size={20} color="#0f172a" />
            <Text className="text-base font-semibold text-slate-900 ml-3">Support & Resources</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
