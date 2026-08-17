import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DiscoveryProfile, discoveryService } from '@/services/discovery.service';
import { useDiscovery } from '@/hooks/useDiscovery';
import { useSubscription } from '@/hooks/useSubscription';
import { FilterSheet } from '@/components/discovery/FilterSheet';
import { SwipeCard } from '@/components/discovery/SwipeCard';
import { verificationService } from '@/services/verification.service';

export default function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState({});
  const [isFilterVisible, setFilterVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPendingVerification, setIsPendingVerification] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(true);

  const { data: profiles, isLoading, isError, refetch } = useDiscovery(filters);
  const { isPremium, dmCredits } = useSubscription();

  const checkVerificationStatus = async () => {
    setIsCheckingVerification(true);
    try {
      const { status } = await verificationService.checkStatus();
      setIsPendingVerification(status === 'submitted' || status === 'in_review');
    } catch (err) {
      console.warn('Failed to check verification status', err);
    } finally {
      setIsCheckingVerification(false);
    }
  };

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const checkPendingVerification = async (): Promise<boolean> => {
    try {
      const { status } = await verificationService.checkStatus();
      if (status === 'submitted' || status === 'in_review') {
        setIsPendingVerification(true);
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

  const handleRefresh = async () => {
    setCurrentIndex(0);
    await checkVerificationStatus();
    await refetch();
  };

  const currentProfile = profiles && profiles.length > currentIndex ? profiles[currentIndex] : null;

  return (
    <View className="flex-1 bg-black relative">
      {isCheckingVerification || isLoading ? (
        <View className="flex-1 justify-center items-center bg-slate-950">
          <ActivityIndicator size="large" color="#4A9B7F" />
          <Text className="text-slate-400 mt-4 text-sm">Loading discovery feed...</Text>
        </View>
      ) : isPendingVerification ? (
        /* Clear pending verification screen instead of generic error */
        <View className="flex-1 bg-slate-950 items-center justify-center p-6">
          <View className="w-20 h-20 rounded-full bg-amber-500/20 items-center justify-center mb-6 border border-amber-500/30">
            <Ionicons name="time-outline" size={40} color="#D97706" />
          </View>

          <Text className="text-2xl font-bold text-white text-center mb-3">
            Verification Under Review
          </Text>

          <Text className="text-slate-300 text-center text-base leading-relaxed mb-6">
            Please wait until admins approve your account to start matching with other members!
          </Text>

          <View className="bg-slate-900 border border-slate-800 p-4 rounded-2xl w-full max-w-sm mb-6">
            <Text className="text-amber-400 font-semibold text-sm mb-2">💡 While waiting for admin approval:</Text>
            <Text className="text-slate-300 text-xs leading-5 mb-1">• View and edit your profile details & photos</Text>
            <Text className="text-slate-300 text-xs leading-5">• Explore app settings & educational resources</Text>
          </View>

          <TouchableOpacity
            onPress={handleRefresh}
            className="bg-[#1B4D5C] px-6 py-3.5 rounded-xl flex-row items-center"
          >
            <Ionicons name="refresh-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
            <Text className="text-white font-bold text-base">Check Approval Status</Text>
          </TouchableOpacity>
        </View>
      ) : isError ? (
        <View className="flex-1 justify-center items-center p-6 bg-slate-950">
          <Ionicons name="alert-circle-outline" size={48} color="#B84C4C" style={{ marginBottom: 16 }} />
          <Text className="text-white text-center font-bold text-xl mb-2">Unable to Load Profiles</Text>
          <Text className="text-slate-400 text-center text-sm mb-6">Please check your network connection and try again.</Text>
          <TouchableOpacity onPress={handleRefresh} className="bg-[#1B4D5C] px-6 py-3 rounded-xl">
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : !currentProfile ? (
        <View className="flex-1 justify-center items-center p-6 bg-slate-950">
          <View className="w-16 h-16 rounded-full bg-teal-500/20 items-center justify-center mb-4 border border-teal-500/30">
            <Ionicons name="sparkles" size={32} color="#4A9B7F" />
          </View>
          <Text className="text-white font-bold text-2xl text-center mb-2">You're All Caught Up!</Text>
          <Text className="text-slate-400 text-center text-base mb-6">There are no more profiles to discover right now. Check back soon!</Text>
          <TouchableOpacity onPress={handleRefresh} className="bg-[#1B4D5C] px-6 py-3.5 rounded-xl flex-row items-center">
            <Ionicons name="refresh-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
            <Text className="text-white font-bold text-base">Refresh Profiles</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* SINGLE PROFILE CARD AT A TIME */
        <SwipeCard
          key={currentProfile.id}
          profile={currentProfile}
          onLike={() => handleLike(currentProfile.id)}
          onPass={() => handlePass(currentProfile.id)}
          onDM={() => handleDM(currentProfile.id)}
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
