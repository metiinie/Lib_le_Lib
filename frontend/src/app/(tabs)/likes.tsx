import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurredPhoto } from '@/components/photos/BlurredPhoto';
import { api } from '@/lib/api';
import { discoveryService } from '@/services/discovery.service';

interface LikeProfile {
  id: string;
  nickname: string;
  age: number;
  region: string;
  photos: { id: string; blurhash: string; url?: string; revealGranted: boolean }[];
}

export default function LikesScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  
  const [receivedLikes, setReceivedLikes] = useState<LikeProfile[]>([]);
  const [sentLikes, setSentLikes] = useState<LikeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      if (activeTab === 'received') {
        const response = await api.get('/swipes/received-likes');
        setReceivedLikes(Array.isArray(response.data) ? response.data : []);
      } else {
        const response = await api.get('/swipes/sent-likes');
        setSentLikes(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err: any) {
      console.warn('Likes endpoint error:', err?.message);
      if (activeTab === 'received') setReceivedLikes([]);
      else setSentLikes([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePass = async (targetId: string, nickname: string) => {
    // Optimistic UI update
    setReceivedLikes(prev => prev.filter(p => p.id !== targetId));
    
    try {
      await discoveryService.passProfile(targetId);
    } catch (error) {
      console.error('Failed to pass:', error);
      Alert.alert('Error', `Failed to pass on ${nickname}. Please try again.`);
      // Reload on failure to restore state
      loadData();
    }
  };

  const renderItem = ({ item }: { item: LikeProfile }) => {
    const primaryPhoto = item.photos?.[0];

    return (
      <TouchableOpacity
        className="flex-1 m-2 aspect-[3/4] bg-slate-100 rounded-2xl overflow-hidden shadow-sm min-h-[48px] min-w-[48px]"
        onPress={() => router.push(`/profiles/${item.id}`)}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={`View profile of ${item.nickname}, ${item.age} years old from ${item.region}`}
      >
        <BlurredPhoto
          blurhash={primaryPhoto?.blurhash || 'LEHV6nWB2yk8pyo0adR*.7kCMdnj'}
          revealGranted={primaryPhoto?.revealGranted || false}
          photoUrl={primaryPhoto?.url}
        />
        <View className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent pt-12">
          <Text className="text-white font-bold text-lg">{item.nickname}, {item.age}</Text>
          <Text className="text-white/80 text-sm">{item.region}</Text>
        </View>

        {/* X / Ignore button for received likes */}
        {activeTab === 'received' && (
          <TouchableOpacity
            className="absolute top-2 right-2 bg-black/40 w-10 h-10 rounded-full items-center justify-center backdrop-blur-md border border-white/20"
            onPress={(e) => {
              e.stopPropagation(); // Prevent navigating to profile
              handlePass(item.id, item.nickname);
            }}
            accessibilityLabel={`Pass on ${item.nickname}`}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const activeProfiles = activeTab === 'received' ? receivedLikes : sentLikes;

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 pt-4 pb-4 border-b border-slate-100">
        <Text className="text-2xl font-bold text-slate-900 mb-4">Likes</Text>
        
        {/* Segmented Control */}
        <View className="flex-row bg-slate-100 rounded-xl p-1">
          <TouchableOpacity 
            className={`flex-1 py-2 rounded-lg items-center justify-center ${activeTab === 'received' ? 'bg-white shadow-sm' : ''}`}
            onPress={() => setActiveTab('received')}
          >
            <Text className={`font-semibold ${activeTab === 'received' ? 'text-slate-900' : 'text-slate-500'}`}>Who Liked Me</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className={`flex-1 py-2 rounded-lg items-center justify-center ${activeTab === 'sent' ? 'bg-white shadow-sm' : ''}`}
            onPress={() => setActiveTab('sent')}
          >
            <Text className={`font-semibold ${activeTab === 'sent' ? 'text-slate-900' : 'text-slate-500'}`}>People I Liked</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#208AEF" />
        </View>
      ) : activeProfiles.length === 0 ? (
        <View className="flex-1 justify-center items-center px-8">
          <View className="w-20 h-20 bg-slate-100 rounded-full items-center justify-center mb-6">
            <Ionicons name={activeTab === 'received' ? "star-outline" : "heart-outline"} size={40} color="#94a3b8" />
          </View>
          <Text className="text-slate-900 text-xl font-bold text-center mb-2">
            {activeTab === 'received' ? 'No likes yet' : 'You haven\'t liked anyone'}
          </Text>
          <Text className="text-slate-500 text-center text-base leading-relaxed">
            {error
              ? 'Failed to load profiles. Please try again later.'
              : activeTab === 'received' 
                ? 'When someone likes your profile, they\'ll appear here.'
                : 'Start exploring and like profiles to see them here.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={activeProfiles}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={{ padding: 8 }}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          initialNumToRender={6}
          maxToRenderPerBatch={10}
        />
      )}
    </View>
  );
}
