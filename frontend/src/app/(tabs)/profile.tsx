import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { verificationService } from '@/services/verification.service';

export default function ProfileHubScreen() {
  const router = useRouter();
  const { signOut } = useAuth();

  const { data: userProfile, isLoading, isError, refetch } = useProfile();

  const [verificationStatus, setVerificationStatus] = useState<'Approved' | 'Pending' | 'Rejected'>('Pending');

  useEffect(() => {
    let mounted = true;
    verificationService.checkStatus().then(({ status }) => {
      if (!mounted) return;
      if (status === 'approved') setVerificationStatus('Approved');
      else if (status === 'submitted' || status === 'in_review') setVerificationStatus('Pending');
      else setVerificationStatus('Rejected');
    }).catch(() => { });
    return () => { mounted = false; };
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-50 justify-center items-center">
        <ActivityIndicator size="large" color="#1B4D5C" />
      </View>
    );
  }

  if (isError || !userProfile) {
    return (
      <View className="flex-1 bg-slate-50 justify-center items-center">
        <Text className="mb-4">Error loading profile.</Text>
        <TouchableOpacity onPress={() => refetch()} className="bg-blue-50 px-4 py-2 rounded-full">
          <Text className="text-blue-600 font-semibold">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const primaryPhotoUrl = userProfile.photos?.find((p: any) => p.isPrimary)?.url
    || userProfile.photos?.[0]?.url
    || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80';

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account?",
      "This action is permanent and cannot be undone. All your matches, messages, photos, and metadata will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Forever",
          style: "destructive",
          onPress: () => {
            // Delete account logic
            console.log("Account deleted");
          }
        }
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-slate-50 pt-16 px-4">
      <Text className="text-3xl font-bold text-slate-900 mb-6 px-2">Profile</Text>

      {/* 1. My Profile & Verification */}
      <Text className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">My Profile</Text>

      <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 items-center mb-6">
        <Image
          source={{ uri: primaryPhotoUrl }}
          style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 12, backgroundColor: '#162A33' }}
        />
        <Text className="text-2xl font-bold text-slate-900 mb-1">{userProfile.nickname || 'Member'}</Text>

        {/* Dynamic Verification Badge */}
        <View className={`flex-row items-center px-3 py-1 rounded-full mt-1 ${verificationStatus === 'Approved' ? 'bg-blue-50' :
          verificationStatus === 'Pending' ? 'bg-amber-50' : 'bg-red-50'
          }`}>
          <Ionicons name={
            verificationStatus === 'Approved' ? "checkmark-circle" :
              verificationStatus === 'Pending' ? "time" : "close-circle"
          } size={14} color={
            verificationStatus === 'Approved' ? "#1B4D5C" :
              verificationStatus === 'Pending' ? "#D4784F" : "#B84C4C"
          } />
          <Text className={`font-bold ml-1 text-xs ${verificationStatus === 'Approved' ? 'text-blue-700' :
            verificationStatus === 'Pending' ? 'text-amber-700' : 'text-red-700'
            }`}>{verificationStatus}</Text>
        </View>

        <View className="flex-row mt-6 space-x-3 gap-3 w-full">
          <TouchableOpacity
            className="flex-1 bg-slate-100 py-3 rounded-xl items-center"
            onPress={() => router.push(`/profiles/${userProfile.id}`)}
          >
            <Text className="text-slate-700 font-semibold">View as others</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-blue-600 py-3 rounded-xl items-center"
            onPress={() => router.push('/profile/edit')}
          >
            <Text className="text-white font-semibold">Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Wellbeing Section */}
      <Text className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">Wellbeing & Support</Text>
      <View className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
        <TouchableOpacity className="p-4 border-b border-slate-50 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-8 h-8 bg-blue-50 rounded-full items-center justify-center mr-3">
              <Ionicons name="library-outline" size={18} color="#1B4D5C" />
            </View>
            <Text className="text-base font-semibold text-slate-900">Health Resource Library</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#4A7A8A" />
        </TouchableOpacity>

        <TouchableOpacity className="p-4 border-b border-slate-50 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-8 h-8 bg-indigo-50 rounded-full items-center justify-center mr-3">
              <Ionicons name="medical-outline" size={18} color="#C49A3C" />
            </View>
            <Text className="text-base font-semibold text-slate-900">Ask a Health Professional</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#4A7A8A" />
        </TouchableOpacity>

        <TouchableOpacity className="p-4 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-8 h-8 bg-emerald-50 rounded-full items-center justify-center mr-3">
              <Ionicons name="heart-half-outline" size={18} color="#4A9B7F" />
            </View>
            <Text className="text-base font-semibold text-slate-900">Success Stories</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#4A7A8A" />
        </TouchableOpacity>
      </View>

      {/* 3. Settings & Account */}
      <Text className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">Settings & Account</Text>
      <View className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-12">
        <TouchableOpacity className="p-4 border-b border-slate-50 flex-row items-center justify-between" onPress={() => router.push('/settings')}>
          <View className="flex-row items-center">
            <Ionicons name="options-outline" size={20} color="#4A7A8A" />
            <Text className="text-base font-semibold text-slate-700 ml-3">Preferences</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#4A7A8A" />
        </TouchableOpacity>

        <TouchableOpacity className="p-4 border-b border-slate-50 flex-row items-center justify-between" onPress={() => router.push('/settings/subscription')}>
          <View className="flex-row items-center">
            <Ionicons name="star-outline" size={20} color="#4A7A8A" />
            <Text className="text-base font-semibold text-slate-700 ml-3">Subscription</Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-slate-400 mr-2 text-sm">Free Plan</Text>
            <Ionicons name="chevron-forward" size={20} color="#4A7A8A" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity className="p-4 border-b border-slate-50 flex-row items-center justify-between" onPress={() => {
          Alert.alert("Sign Out", "Are you sure you want to sign out?", [
            { text: "Cancel", style: "cancel" },
            { text: "Sign Out", onPress: () => signOut() }
          ]);
        }}>
          <View className="flex-row items-center">
            <Ionicons name="log-out-outline" size={20} color="#4A7A8A" />
            <Text className="text-base font-semibold text-slate-700 ml-3">Sign Out</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity className="p-4 flex-row items-center justify-between" onPress={handleDeleteAccount}>
          <View className="flex-row items-center">
            <Ionicons name="trash-outline" size={20} color="#B84C4C" />
            <Text className="text-base font-semibold text-red-500 ml-3">Delete Account</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
