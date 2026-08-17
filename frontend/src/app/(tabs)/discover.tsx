import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DiscoveryProfile, discoveryService } from '@/services/discovery.service';
import { useDiscovery } from '@/hooks/useDiscovery';
import { useSubscription } from '@/hooks/useSubscription';
import { FilterSheet } from '@/components/discovery/FilterSheet';
import { SwipeCard } from '@/components/discovery/SwipeCard';

import { verificationService } from '@/services/verification.service';

const { height } = Dimensions.get('window');

export default function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState({});
  const [isFilterVisible, setFilterVisible] = useState(false);

  const { data: profiles, isLoading, isError, refetch } = useDiscovery(filters);
  const { isPremium, dmCredits } = useSubscription();

  const checkPendingVerification = async (): Promise<boolean> => {
    try {
      const { status } = await verificationService.checkStatus();
      if (status === 'submitted' || status === 'in_review') {
        Alert.alert(
          'Verification Pending',
          'Your document is currently under review by our admin team. You can view profiles and educational content. Swiping and messaging will unlock automatically once approved!',
          [{ text: 'Got it' }]
        );
        return true;
      }
    } catch (err) {
      console.warn('Failed to check verification status', err);
    }
    return false;
  };

  const handleLike = async (profileId: string) => {
    if (await checkPendingVerification()) return;
    try {
      await discoveryService.likeProfile(profileId);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePass = async (profileId: string) => {
    if (await checkPendingVerification()) return;
    try {
      await discoveryService.passProfile(profileId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDM = async (profileId: string) => {
    if (await checkPendingVerification()) return;
    if (!isPremium) {
      Alert.alert(
        'Premium Required',
        'Upgrade to Premium to send direct messages without matching first.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', style: 'default', onPress: () => router.push('/(tabs)/profile') }
        ]
      );
      return;
    }

    if (dmCredits <= 0) {
      Alert.alert('Out of Credits', 'You have no DM credits left.');
      return;
    }

    try {
      router.push(`/chat/${profileId}?type=request`);
    } catch (err: any) {
      console.error(err);
    }
  };

  const renderItem = ({ item }: { item: DiscoveryProfile }) => {
    return (
      <SwipeCard
        profile={item}
        onLike={() => handleLike(item.id)}
        onPass={() => handlePass(item.id)}
        onDM={() => handleDM(item.id)}
      />
    );
  };

  return (
    <View className="flex-1 bg-black relative">
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4A9B7F" />
        </View>
      ) : isError ? (
        <View className="flex-1 justify-center items-center p-4 bg-white">
          <Text className="text-slate-500 text-center mb-4">Something went wrong while loading profiles.</Text>
          <TouchableOpacity onPress={() => refetch()} className="bg-blue-50 px-4 py-2 rounded-full">
            <Text className="text-blue-600 font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : profiles?.length === 0 ? (
        <View className="flex-1 justify-center items-center p-4 bg-white">
          <Text className="text-slate-500 text-center text-lg mb-2">No profiles found</Text>
          <Text className="text-slate-400 text-center">Try adjusting your filters to see more people.</Text>
        </View>
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={height} // Snaps to screen height
          snapToAlignment="start"
          decelerationRate="fast"
          removeClippedSubviews={true}
          initialNumToRender={3}
          maxToRenderPerBatch={5}
          windowSize={5}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#ffffff" />}
          style={{ flex: 1 }}
        />
      )}

      {/* Floating Header */}
      <View
        className="absolute top-0 left-0 right-0 flex-row justify-between items-center px-4"
        style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: 16 }}
        pointerEvents="box-none"
      >
        <Text className="text-3xl font-bold text-white shadow-sm" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>
          Discover
        </Text>
        <TouchableOpacity
          className="bg-black/30 px-4 py-2 rounded-full min-h-[48px] min-w-[48px] justify-center items-center border border-white/20 backdrop-blur-md"
          accessibilityRole="button"
          accessibilityLabel="Filter profiles"
          onPress={() => setFilterVisible(true)}
        >
          <Ionicons name="options" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <FilterSheet
        visible={isFilterVisible}
        onClose={() => setFilterVisible(false)}
        filters={filters}
        setFilters={setFilters}
      />
    </View>
  );
}
