import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { discoveryService, DiscoveryProfile } from '@/services/discovery.service';
import { profileService } from '@/services/profile.service';
import { BlurredPhoto } from '@/components/photos/BlurredPhoto';

export default function ProfileDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<DiscoveryProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      if (!id) {
        if (isMounted) {
          setNotFound(true);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setNotFound(false);

        // 1. Check if viewing own profile
        const myProfile = await profileService.getProfile().catch(() => null);
        if (myProfile && (myProfile.id === id || myProfile.userId === id)) {
          if (isMounted) {
            setProfile({
              id: myProfile.id,
              nickname: myProfile.nickname || 'Member',
              age: myProfile.age || 25,
              gender: myProfile.gender || 'Not specified',
              region: myProfile.region || 'Nearby',
              bio: myProfile.bio || '',
              relationshipGoals: myProfile.relationshipGoals || [],
              photos: myProfile.photos?.map((p: any) => ({
                id: p.id,
                blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
                url: p.url,
                revealGranted: true
              })) || [],
              isBlocked: false,
            } as DiscoveryProfile);
            setLoading(false);
          }
          return;
        }

        // 2. Fetch profiles from discovery feed
        const profiles = await discoveryService.getProfiles().catch(() => []);
        const found = profiles.find(p => p.id === id || (p as any).userId === id);

        if (isMounted) {
          if (found) {
            setProfile(found);
          } else {
            setNotFound(true);
          }
        }
      } catch (err) {
        console.warn('Failed to load profile', err);
        if (isMounted) setNotFound(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProfile();

    return () => { isMounted = false; };
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

  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#1B4D5C" />
      </View>
    );
  }

  if (notFound || !profile) {
    return (
      <View className="flex-1 bg-[#F5F7F8] justify-center items-center p-6">
        <View className="w-20 h-20 rounded-full bg-slate-100 items-center justify-center mb-6">
          <Ionicons name="person-outline" size={40} color="#4A7A8A" />
        </View>

        <Text className="text-2xl font-bold text-slate-900 text-center mb-2">
          Profile Unavailable
        </Text>

        <Text className="text-slate-500 text-center text-base leading-relaxed mb-6 px-4">
          This profile could not be loaded or is no longer available.
        </Text>

        <TouchableOpacity
          className="bg-[#1B4D5C] px-6 py-3.5 rounded-full flex-row items-center shadow-sm"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={18} color="#ffffff" style={{ marginRight: 8 }} />
          <Text className="text-white font-bold text-base">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white relative">
      {/* Top Header Back Button */}
      <TouchableOpacity
        className="absolute top-12 left-4 z-10 w-10 h-10 rounded-full bg-black/40 items-center justify-center border border-white/20"
        onPress={() => router.back()}
      >
        <Ionicons name="chevron-back" size={24} color="white" />
      </TouchableOpacity>

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

          {profile.relationshipGoals && profile.relationshipGoals.length > 0 && (
            <View className="bg-blue-50 self-start px-3 py-1 rounded-full mb-6">
              <Text className="text-blue-700 font-medium capitalize">
                {profile.relationshipGoals[0]?.replace('_', ' ')}
              </Text>
            </View>
          )}

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

