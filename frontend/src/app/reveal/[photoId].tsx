import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';

export default function PhotoRevealScreen() {
  const { photoId, matchId } = useLocalSearchParams<{ photoId: string; matchId: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [granted, setGranted] = useState(false); // Should realistically be pulled from the API

  const handleGrant = async () => {
    setLoading(true);
    try {
      if (photoId === 'new' || !matchId) {
        // Mock successful grant for 'new' photo placeholder
        setTimeout(() => {
          setGranted(true);
          setLoading(false);
        }, 800);
        return;
      }
      // POST /photos/:id/reveal-grants
      await api.post(`/photos/${photoId}/reveal-grants`, { targetUserId: matchId });
      setGranted(true);
    } catch (err) {
      console.error(err);
    } finally {
      if (photoId !== 'new' && matchId) setLoading(false);
    }
  };

  const handleRevoke = async () => {
    setLoading(true);
    try {
      if (photoId === 'new' || !matchId) {
        // Mock successful revoke for 'new' photo placeholder
        setTimeout(() => {
          setGranted(false);
          setLoading(false);
        }, 800);
        return;
      }
      // DELETE /photos/:id/reveal-grants/:targetUserId
      await api.delete(`/photos/${photoId}/reveal-grants/${matchId}`);
      setGranted(false);
    } catch (err) {
      console.error(err);
    } finally {
      if (photoId !== 'new' && matchId) setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white px-6 pt-16">
      <View className="flex-row items-center mb-12">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mr-4">
          <Ionicons name="close" size={28} color="#0F1E24" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-slate-900">Photo Access</Text>
      </View>

      <View className="flex-1 justify-center items-center pb-20">
        <View className="w-24 h-24 rounded-full bg-blue-100 items-center justify-center mb-6">
          <Ionicons name={granted ? "eye-outline" : "eye-off-outline"} size={48} color="#1B4D5C" />
        </View>

        <Text className="text-xl font-bold text-center text-slate-900 mb-4">
          {granted ? "Access Granted" : "Share this photo?"}
        </Text>
        
        <Text className="text-center text-slate-600 mb-12 px-4 leading-relaxed">
          {granted 
            ? "This user can currently view the unblurred version of this photo." 
            : "If you grant access, the recipient will be able to view the unblurred version of this photo. You can revoke this at any time."}
        </Text>

        {loading ? (
           <ActivityIndicator size="large" color="#1B4D5C" />
        ) : granted ? (
          <TouchableOpacity 
            className="w-full bg-red-100 py-4 rounded-xl items-center"
            onPress={handleRevoke}
          >
            <Text className="text-red-700 font-bold text-lg">Revoke Access</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            className="w-full bg-blue-600 py-4 rounded-xl items-center"
            onPress={handleGrant}
          >
            <Text className="text-white font-bold text-lg">Grant Reveal</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
