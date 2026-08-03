import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurredPhoto } from '@/components/photos/BlurredPhoto';
import { useLikes, LikeProfile } from '@/hooks/useLikes';

export default function LikesScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  
  const { data: activeProfiles, isLoading, isError, refetch, passProfile } = useLikes(activeTab);

  const handlePass = async (targetId: string, nickname: string) => {
    try {
      await passProfile(targetId);
    } catch (error) {
      console.error('Failed to pass:', error);
      Alert.alert('Error', `Failed to pass on ${nickname}. Please try again.`);
      refetch();
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
          revealGranted={true} // Photos are unblurred by default for verified users
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

  const renderEmptyState = () => {
    if (isLoading) return null; // Let the RefreshControl or ActivityIndicator handle the loading UI
    return (
      <View className="flex-1 justify-center items-center px-8 mt-20">
        <View className="w-20 h-20 bg-slate-100 rounded-full items-center justify-center mb-6">
          <Ionicons name={activeTab === 'received' ? "star-outline" : "heart-outline"} size={40} color="#94a3b8" />
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
        {isError && (
          <TouchableOpacity onPress={() => refetch()} className="mt-4 bg-blue-50 px-4 py-2 rounded-full">
            <Text className="text-blue-600 font-semibold">Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 pt-4 pb-4 border-b border-slate-100">
        <Text className="text-2xl font-bold text-slate-900 mb-4">Likes</Text>
        
        {/* Segmented Control */}
        <View className="flex-row bg-slate-100 rounded-xl p-1">
          <TouchableOpacity 
            className="flex-1 py-2 rounded-lg items-center justify-center"
            style={activeTab === 'received' ? { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 } : undefined}
            onPress={() => setActiveTab('received')}
          >
            <Text className={activeTab === 'received' ? 'font-semibold text-slate-900' : 'font-semibold text-slate-500'}>Who Liked Me</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="flex-1 py-2 rounded-lg items-center justify-center"
            style={activeTab === 'sent' ? { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 } : undefined}
            onPress={() => setActiveTab('sent')}
          >
            <Text className={activeTab === 'sent' ? 'font-semibold text-slate-900' : 'font-semibold text-slate-500'}>People I Liked</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading && !activeProfiles?.length ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#208AEF" />
        </View>
      ) : (
        <FlatList
          data={activeProfiles}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={{ padding: 8, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          initialNumToRender={6}
          maxToRenderPerBatch={10}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              colors={['#208AEF']}
              tintColor="#208AEF"
            />
          }
        />
      )}
    </View>
  );
}
