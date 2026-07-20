import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { accountService } from '@/services/account.service';

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [deleting, setDeleting] = useState(false);

  const confirmDeletion = () => {
    Alert.alert(
      "Are you absolutely sure?",
      "This will permanently delete your profile, photos, matches, chat history, and verification records. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Yes, Delete Everything", 
          style: "destructive",
          onPress: handleDelete
        }
      ]
    );
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await accountService.deleteAccount();
      signOut();
      router.replace('/');
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to delete account. Please contact support.");
      setDeleting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white pt-16 px-6">
      <View className="flex-row items-center mb-12">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mr-4">
          <Ionicons name="chevron-back" size={28} color="#0f172a" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-slate-900">Account</Text>
      </View>

      <View className="items-center mb-8">
        <View className="w-20 h-20 bg-red-50 rounded-full items-center justify-center mb-6 border border-red-100">
          <Ionicons name="warning" size={40} color="#ef4444" />
        </View>
        <Text className="text-xl font-bold text-slate-900 mb-2">Delete Account</Text>
        <Text className="text-slate-600 text-center px-4 leading-relaxed">
          Deleting your account is permanent. All your data will be immediately and irreversibly destroyed from our servers.
        </Text>
      </View>

      <View className="bg-slate-50 border border-slate-200 p-5 rounded-2xl mb-8">
        <Text className="font-bold text-slate-800 mb-4">What you will lose:</Text>
        <View className="flex-row items-center mb-3"><Ionicons name="close" color="#ef4444" size={20} /><Text className="ml-2 text-slate-700">Your profile and verified status</Text></View>
        <View className="flex-row items-center mb-3"><Ionicons name="close" color="#ef4444" size={20} /><Text className="ml-2 text-slate-700">All photos and reveal grants</Text></View>
        <View className="flex-row items-center mb-3"><Ionicons name="close" color="#ef4444" size={20} /><Text className="ml-2 text-slate-700">Your match history</Text></View>
        <View className="flex-row items-center"><Ionicons name="close" color="#ef4444" size={20} /><Text className="ml-2 text-slate-700">All encrypted chat history</Text></View>
      </View>

      <TouchableOpacity 
        className="w-full bg-red-600 py-4 rounded-xl items-center flex-row justify-center shadow-sm"
        onPress={confirmDeletion}
        disabled={deleting}
      >
        {deleting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="trash" size={20} color="#fff" />
            <Text className="text-white font-bold text-lg ml-2">Permanently Delete Account</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
