import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { discoveryService, DiscoveryProfile } from '@/services/discovery.service';
import { BlurredPhoto } from '@/components/photos/BlurredPhoto';

export default function ProfileDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<DiscoveryProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, we'd fetch the specific profile by ID.
    // For now, we mock finding it from the discovery feed.
    discoveryService.getProfiles().then(profiles => {
      const found = profiles.find(p => p.id === id);
      if (found) setProfile(found);
      setLoading(false);
    });
  }, [id]);

  const handleAction = async (action: 'like' | 'pass') => {
    if (!id) return;
    try {
      if (action === 'like') {
        await discoveryService.likeProfile(id);
      } else {
        await discoveryService.passProfile(id);
      }
      router.back();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !profile) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#1B4D5C" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="w-full aspect-[4/5] bg-slate-100">
          <BlurredPhoto
            blurhash={profile.photos[0]?.blurhash || 'LEHV6nWB2yk8pyo0adR*.7kCMdnj'}
            revealGranted={profile.photos[0]?.revealGranted || false}
            photoUrl={profile.photos[0]?.url}
          />
        </View>

        <View className="p-6">
          <View className="flex-row justify-between items-end mb-4">
            <View>
              <Text className="text-3xl font-bold text-slate-900">{profile.nickname}</Text>
              <Text className="text-slate-500 text-lg">{profile.age} • {profile.region}</Text>
            </View>
          </View>

          <View className="bg-blue-50 self-start px-3 py-1 rounded-full mb-6">
            <Text className="text-blue-700 font-medium capitalize">{profile.relationshipGoals[0]?.replace('_', ' ')}</Text>
          </View>

          <Text className="text-slate-800 text-base leading-relaxed mb-8">
            {profile.bio || "No bio provided."}
          </Text>

        </View>
      </ScrollView>

      {/* Action Bar */}
      <View className="flex-row justify-evenly items-center py-6 px-4 border-t border-slate-100 bg-white/90 pb-8">
        <TouchableOpacity 
          className="w-16 h-16 rounded-full bg-slate-100 items-center justify-center shadow-sm"
          onPress={() => handleAction('pass')}
        >
          <Text className="text-slate-600 text-2xl font-bold">✕</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="w-20 h-20 rounded-full bg-blue-600 items-center justify-center shadow-md"
          onPress={() => handleAction('like')}
        >
          <Text className="text-white text-3xl font-bold">♥</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
