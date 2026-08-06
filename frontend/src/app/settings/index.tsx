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
          <Ionicons name="chevron-back" size={28} color="#0F1E24" />
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
            trackColor={{ false: '#D6DFE2', true: '#1B4D5C' }}
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
            trackColor={{ false: '#D6DFE2', true: '#1B4D5C' }}
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
            trackColor={{ false: '#D6DFE2', true: '#1B4D5C' }}
          />
        </View>

        {/* Photos Visibility */}
        <View className="p-4 border-b border-slate-100 flex-row items-center justify-between">
          <View className="flex-1 mr-4">
            <Text className="text-base font-bold text-slate-900 mb-1">Show Photos to Verified</Text>
            <Text className="text-slate-500 text-xs">Allow verified members to see your photos unblurred.</Text>
          </View>
          <Switch
            value={prefs.photosVisibleToVerified}
            onValueChange={async (val) => {
              prefs.setPreference('photosVisibleToVerified', val);
              try {
                // Import would ideally be at top level but doing this to keep file edits self-contained for now, or assume it doesn't matter too much in this demo if we don't await the import here.
                const { profileService } = await import('@/services/profile.service');
                await profileService.updateProfile({ photosVisibleToVerified: val });
              } catch (err) {
                console.error('Failed to save photos visibility preference', err);
              }
            }}
            trackColor={{ false: '#D6DFE2', true: '#1B4D5C' }}
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
            <Ionicons name="trash-outline" size={20} color="#B84C4C" />
            <Text className="text-red-600 font-bold ml-3">Delete Account</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#4A7A8A" />
        </TouchableOpacity>
        
        <TouchableOpacity className="p-4 flex-row items-center justify-between" onPress={handleLogout}>
          <View className="flex-row items-center">
            <Ionicons name="log-out-outline" size={20} color="#4A7A8A" />
            <Text className="text-slate-600 font-bold ml-3">Log out</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
