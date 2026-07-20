import React from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { usePreferencesStore } from '@/stores/preferences.store';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SettingsIndexScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  
  const prefs = usePreferencesStore();

  const handleLogout = () => {
    signOut();
    router.replace('/');
  };

  return (
    <ScrollView className="flex-1 bg-slate-50 pt-16 px-6">
      <View className="flex-row items-center mb-8">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mr-4">
          <Ionicons name="chevron-back" size={28} color="#0f172a" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-slate-900">Preferences</Text>
      </View>

      <View className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-6 overflow-hidden">
        
        {/* Discreet Mode */}
        <View className="p-4 border-b border-slate-100 flex-row items-center justify-between">
          <View className="flex-1 mr-4">
            <Text className="text-base font-bold text-slate-900 mb-1">Discreet Mode</Text>
            <Text className="text-slate-500 text-xs">Hides activity status and read receipts.</Text>
          </View>
          <Switch
            value={prefs.isDiscreetMode}
            onValueChange={(val) => prefs.setPreference('isDiscreetMode', val)}
            trackColor={{ false: '#cbd5e1', true: '#4f46e5' }}
          />
        </View>

        {/* Low-Bandwidth Mode */}
        <View className="p-4 border-b border-slate-100 flex-row items-center justify-between">
          <View className="flex-1 mr-4">
            <Text className="text-base font-bold text-slate-900 mb-1">Low Bandwidth</Text>
            <Text className="text-slate-500 text-xs">Never load full-res photos, only blurhashes.</Text>
          </View>
          <Switch
            value={prefs.isLowBandwidthMode}
            onValueChange={(val) => prefs.setPreference('isLowBandwidthMode', val)}
            trackColor={{ false: '#cbd5e1', true: '#4f46e5' }}
          />
        </View>

        {/* Notifications */}
        <View className="p-4 border-b border-slate-100 flex-row items-center justify-between">
          <View className="flex-1 mr-4">
            <Text className="text-base font-bold text-slate-900 mb-1">Push Notifications</Text>
            <Text className="text-slate-500 text-xs">Receive alerts for new matches and messages.</Text>
          </View>
          <Switch
            value={prefs.notificationsEnabled}
            onValueChange={(val) => prefs.setPreference('notificationsEnabled', val)}
            trackColor={{ false: '#cbd5e1', true: '#4f46e5' }}
          />
        </View>

        {/* Language */}
        <View className="p-4 flex-row items-center justify-between">
          <View className="flex-1 mr-4">
            <Text className="text-base font-bold text-slate-900 mb-1">App Language</Text>
            <Text className="text-slate-500 text-xs">Switch between English and Amharic.</Text>
          </View>
          <TouchableOpacity 
            className="bg-slate-100 px-3 py-1.5 rounded-full"
            onPress={() => prefs.setPreference('language', prefs.language === 'en' ? 'am' : 'en')}
          >
            <Text className="text-slate-900 font-bold">{prefs.language === 'en' ? 'English' : 'አማርኛ'}</Text>
          </TouchableOpacity>
        </View>

      </View>

      <View className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-6 overflow-hidden">
        <TouchableOpacity className="p-4 border-b border-slate-100 flex-row items-center justify-between" onPress={() => router.push('/settings/account')}>
          <View className="flex-row items-center">
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
            <Text className="text-red-600 font-bold ml-3">Delete Account</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
        </TouchableOpacity>
        
        <TouchableOpacity className="p-4 flex-row items-center justify-between" onPress={handleLogout}>
          <View className="flex-row items-center">
            <Ionicons name="log-out-outline" size={20} color="#64748b" />
            <Text className="text-slate-600 font-bold ml-3">Log out</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
