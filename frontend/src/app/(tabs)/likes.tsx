import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurredPhoto } from '@/components/photos/BlurredPhoto';
import { useLikes, LikeProfile } from '@/hooks/useLikes';
import { useSubscription } from '@/hooks/useSubscription';

export default function LikesScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const { isPremium } = useSubscription();
  
  const { data: activeProfiles, isLoading, isError, refetch, passProfile, likeBack, withdrawLike } = useLikes(activeTab);

  const handlePass = async (targetId: string, nickname: string) => {
    try {
      await passProfile(targetId);
    } catch (error) {
      console.error('Failed to pass:', error);
      Alert.alert('Error', `Failed to pass on ${nickname}. Please try again.`);
      refetch();
    }
  };

  const handleLikeBack = async (targetId: string, nickname: string) => {
    try {
      await likeBack(targetId);
      // Wait a tiny bit then alert or just show a custom toast/banner
      Alert.alert("It's a Match!", `You matched with ${nickname}. Open your Matches tab to say hi!`);
    } catch (error) {
      console.error('Failed to like back:', error);
      Alert.alert('Error', `Failed to match with ${nickname}.`);
    }
  };

  const handleWithdraw = (targetId: string, nickname: string) => {
    Alert.alert(
      "Withdraw Like?",
      `Are you sure you want to withdraw your like for ${nickname}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Withdraw", 
          style: "destructive",
          onPress: async () => {
            try {
              await withdrawLike(targetId);
            } catch (error) {
              Alert.alert('Error', 'Failed to withdraw like.');
            }
          }
        }
      ]
    );
  };

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'Just now';
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `${hours || 1} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  const renderItem = ({ item, index }: { item: LikeProfile, index: number }) => {
    const primaryPhoto = item.photos?.[0];

    // Premium Upsell CTA injection
    if (activeTab === 'received' && index === 2 && !isPremium) {
      return (
        <TouchableOpacity
          className="flex-1 m-2 aspect-[3/4] bg-blue-600 rounded-2xl overflow-hidden shadow-sm min-h-[48px] min-w-[48px] items-center justify-center p-4"
          onPress={() => router.push('/settings/subscription')}
          activeOpacity={0.9}
        >
          <Ionicons name="lock-closed" size={32} color="white" className="mb-2" />
          <Text className="text-white font-bold text-center text-lg mb-1">Unlock</Text>
          <Text className="text-blue-100 text-center text-xs">See who liked you</Text>
        </TouchableOpacity>
      );
    }

    const isReceivedFree = activeTab === 'received' && !isPremium;
    const displayName = isReceivedFree ? 'Secret Admirer' : item.nickname;

    return (
      <TouchableOpacity
        className="flex-1 m-2 aspect-[3/4] bg-slate-100 rounded-2xl overflow-hidden shadow-sm min-h-[48px] min-w-[48px]"
        onPress={() => !isReceivedFree && router.push(`/profiles/${item.id}`)}
        onLongPress={() => activeTab === 'sent' && handleWithdraw(item.id, item.nickname)}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={`Profile of ${displayName}`}
      >
        <BlurredPhoto
          blurhash={primaryPhoto?.blurhash || 'LEHV6nWB2yk8pyo0adR*.7kCMdnj'}
          revealGranted={!isReceivedFree} // Silhouette blur if free tier
          photoUrl={primaryPhoto?.url}
        />
        
        {/* Sent Like Details (Timestamp & Status) */}
        {activeTab === 'sent' && (
          <View className="absolute top-2 left-2 right-2 flex-row justify-between">
            <View className={`px-2 py-1 rounded-full shadow-sm ${item.status === 'Matched!' ? 'bg-green-500' : 'bg-slate-800/80'}`}>
              <Text className="text-[10px] font-bold text-white">{item.status}</Text>
            </View>
          </View>
        )}

        <View className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent pt-12">
          <Text className="text-white font-bold text-lg">{displayName}, {item.age}</Text>
          <Text className="text-white/80 text-sm">{item.region}</Text>
          {activeTab === 'sent' && (
            <Text className="text-slate-300 text-xs mt-1">{formatTimeAgo(item.createdAt)}</Text>
          )}
        </View>

        {/* Action Buttons for Received Likes */}
        {activeTab === 'received' && !isReceivedFree && (
          <View className="absolute top-2 right-2 flex-row space-x-2 gap-2">
            <TouchableOpacity
              className="bg-black/40 w-8 h-8 rounded-full items-center justify-center backdrop-blur-md border border-white/20"
              onPress={(e) => {
                e.stopPropagation();
                handlePass(item.id, item.nickname);
              }}
            >
              <Ionicons name="close" size={16} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-[#1B4D5C] w-8 h-8 rounded-full items-center justify-center shadow-md border border-white/20"
              onPress={(e) => {
                e.stopPropagation();
                handleLikeBack(item.id, item.nickname);
              }}
            >
              <Ionicons name="heart" size={16} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (isLoading) return null;
    return (
      <View className="flex-1 justify-center items-center px-8 mt-20">
        <View className="w-20 h-20 bg-slate-100 rounded-full items-center justify-center mb-6">
          <Ionicons name={activeTab === 'received' ? "star-outline" : "heart-outline"} size={40} color="#4A7A8A" />
        </View>
        <Text className="text-slate-900 text-xl font-bold text-center mb-2">
          {activeTab === 'received' ? 'No likes yet' : 'You haven\'t liked anyone'}
        </Text>
        <Text className="text-slate-500 text-center text-base leading-relaxed">
          {isError
            ? 'Failed to load profiles. Please try again later.'
            : activeTab === 'received' 
              ? 'When someone likes your profile, they\'ll appear here.'
              : 'Start exploring and like profiles to see them here.'}
        </Text>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 pt-4 pb-4 border-b border-slate-100">
        <Text className="text-2xl font-bold text-slate-900 mb-4">Likes</Text>
        
        <View className="flex-row bg-slate-100 rounded-xl p-1">
          <TouchableOpacity 
            className="flex-1 py-2 rounded-lg items-center justify-center"
            style={activeTab === 'received' ? { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 } : undefined}
            onPress={() => setActiveTab('received')}
          >
            <Text className={activeTab === 'received' ? 'font-semibold text-slate-900' : 'font-semibold text-slate-500'}>Received ❤️</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="flex-1 py-2 rounded-lg items-center justify-center"
            style={activeTab === 'sent' ? { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 } : undefined}
            onPress={() => setActiveTab('sent')}
          >
            <Text className={activeTab === 'sent' ? 'font-semibold text-slate-900' : 'font-semibold text-slate-500'}>Sent ❤️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Free Tier Like Count */}
      {activeTab === 'received' && activeProfiles && activeProfiles.length > 0 && (
        <View className="px-4 py-3 border-b border-slate-50 flex-row items-center justify-between">
          <Text className="text-slate-600 font-medium">{activeProfiles.length} people liked you</Text>
          {!isPremium && (
            <TouchableOpacity onPress={() => router.push('/settings/subscription')}>
              <Text className="text-blue-600 font-semibold text-sm">See all</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {isLoading && !activeProfiles?.length ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#1B4D5C" />
        </View>
      ) : (
        <FlatList
          data={activeProfiles}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={{ padding: 8, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#1B4D5C" />}
        />
      )}
    </View>
  );
}
