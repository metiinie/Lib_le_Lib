import React, { useRef, useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Match, DmRequest } from '@/services/match.service';
import { BlurredPhoto } from '@/components/photos/BlurredPhoto';
import { useMatches } from '@/hooks/useMatches';
import { verificationService } from '@/services/verification.service';

export default function MatchesScreen() {
  const router = useRouter();
  const [isPendingVerification, setIsPendingVerification] = useState(false);

  useEffect(() => {
    let isMounted = true;
    verificationService.checkStatus().then(({ status }) => {
      if (isMounted) {
        setIsPendingVerification(status === 'submitted' || status === 'in_review');
      }
    }).catch(() => { });
    return () => { isMounted = false; };
  }, []);

  const { data: matches, isLoading, isError, refetch, unmatch, block, dmRequests, acceptDmRequest } = useMatches();

  // Reference for swipeable items to close them
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());

  const handleUnmatch = (item: Match) => {
    Alert.alert("Unmatch", `Are you sure you want to unmatch ${item.matchedUserNickname}?`, [
      { text: "Cancel", style: "cancel", onPress: () => swipeableRefs.current.get(item.id)?.close() },
      { text: "Unmatch", style: "destructive", onPress: () => unmatch(item.id) }
    ]);
  };

  const handleBlock = (item: Match) => {
    Alert.alert("Block User", `Are you sure you want to block ${item.matchedUserNickname}? They will disappear silently.`, [
      { text: "Cancel", style: "cancel", onPress: () => swipeableRefs.current.get(item.id)?.close() },
      { text: "Block", style: "destructive", onPress: () => block(item.matchedUserId) }
    ]);
  };

  const renderRightActions = (item: Match) => {
    return (
      <View className="flex-row w-40">
        <TouchableOpacity
          className="flex-1 bg-orange-500 justify-center items-center"
          onPress={() => handleUnmatch(item)}
        >
          <Ionicons name="close-circle-outline" size={24} color="white" className="mb-1" />
          <Text className="text-white text-xs font-bold">Unmatch</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-red-600 justify-center items-center"
          onPress={() => handleBlock(item)}
        >
          <Ionicons name="ban" size={24} color="white" className="mb-1" />
          <Text className="text-white text-xs font-bold">Block</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderDmRequest = ({ item }: { item: DmRequest }) => {
    return (
      <View className="flex-row items-center p-4 border-b border-slate-100 bg-amber-50">
        <View className="w-16 h-16 rounded-full overflow-hidden bg-slate-200 mr-4">
          <BlurredPhoto blurhash="LEHV6nWB2yk8pyo0adR*.7kCMdnj" revealGranted={true} photoUrl={item.avatarUrl} />
        </View>
        <View className="flex-1 justify-center">
          <Text className="text-lg font-bold text-slate-900 mb-1">{item.nickname}</Text>
          <Text className="text-slate-800 font-medium italic" numberOfLines={1}>"{item.message}"</Text>
        </View>
        <TouchableOpacity
          className="bg-blue-600 px-4 py-2 rounded-full"
          onPress={() => acceptDmRequest(item.id)}
        >
          <Text className="text-white font-bold">Accept</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderMatch = ({ item }: { item: Match }) => {
    const isUnread = (item.unreadCount || 0) > 0;
    // Mock discreet mode state
    const isDiscreetMode = false;

    return (
      <Swipeable
        ref={ref => {
          if (ref) swipeableRefs.current.set(item.id, ref);
          else swipeableRefs.current.delete(item.id);
        }}
        renderRightActions={() => renderRightActions(item)}
        overshootRight={false}
      >
        <TouchableOpacity
          className={`flex-row items-center p-4 border-b border-slate-100 ${isUnread && !isDiscreetMode ? 'bg-blue-50/30' : 'bg-white'} active:bg-slate-50`}
          onPress={() => router.push(`/chat/${item.id}`)}
          activeOpacity={1}
          accessibilityRole="button"
          accessibilityLabel={`Chat with ${item.matchedUserNickname}`}
        >
          <View className="w-16 h-16 rounded-full overflow-hidden bg-slate-200 mr-4">
            <BlurredPhoto
              blurhash={item.avatarBlurhash}
              revealGranted={true}
              photoUrl={item.avatarUrl}
            />
          </View>
          <View className="flex-1 justify-center">
            <Text className={`text-lg mb-1 ${isUnread && !isDiscreetMode ? 'font-black text-slate-900' : 'font-bold text-slate-900'}`}>
              {item.matchedUserNickname}
            </Text>
            <Text className={`${isUnread && !isDiscreetMode ? 'text-slate-800 font-semibold' : 'text-slate-500 font-medium'}`} numberOfLines={1}>
              {item.lastMessageEncryptedPreview ? 'New message' : 'Tap to start chatting'}
            </Text>
          </View>

          {/* Unread Indicator */}
          {isUnread && !isDiscreetMode && (
            <View className="w-3 h-3 rounded-full bg-blue-500 ml-2 shadow-sm" />
          )}
        </TouchableOpacity>
      </Swipeable>
    );
  };

  // Determine if there are new matches in the last 24h
  const newMatches = matches?.filter(m => m.createdAt && (Date.now() - new Date(m.createdAt).getTime() < 24 * 60 * 60 * 1000));
  const hasNewMatches = newMatches && newMatches.length > 0;

  if (isPendingVerification) {
    return (
      <View className="flex-1 bg-[#F5F7F8] items-center justify-center p-6">
        <View className="w-20 h-20 rounded-full bg-amber-100 items-center justify-center mb-6 border border-amber-200">
          <Ionicons name="time-outline" size={40} color="#D4784F" />
        </View>

        <Text className="text-2xl font-bold text-[#0F1E24] text-center mb-3">
          Verification Under Review
        </Text>

        <Text className="text-[#4A7A8A] text-center text-base leading-relaxed mb-6 px-4">
          Matches and messaging unlock once your profile is verified by an admin. You can view and update your profile details in the meantime!
        </Text>

        <TouchableOpacity
          onPress={() => router.push('/(tabs)/profile')}
          className="bg-[#1B4D5C] px-6 py-3.5 rounded-full flex-row items-center shadow-sm"
        >
          <Ionicons name="person-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
          <Text className="text-white font-bold text-base">View & Edit Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 py-4 border-b border-slate-100">
        <Text className="text-2xl font-bold text-slate-900">Your Matches</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#1B4D5C" />
        </View>
      ) : isError ? (
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-slate-500 text-center mb-4">Something went wrong while loading matches.</Text>
          <TouchableOpacity onPress={() => refetch()} className="bg-blue-50 px-4 py-2 rounded-full">
            <Text className="text-blue-600 font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : matches?.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <View className="w-20 h-20 bg-slate-100 rounded-full items-center justify-center mb-6">
            <Ionicons name="chatbubble-outline" size={40} color="#4A7A8A" />
          </View>
          <Text className="text-slate-900 text-xl font-bold text-center mb-2">No matches yet</Text>
          <Text className="text-slate-500 text-center text-base">Keep discovering to find new connections.</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          renderItem={renderMatch}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#1B4D5C" />}
          ListHeaderComponent={
            hasNewMatches || (dmRequests && dmRequests.length > 0) ? (
              <View>
                {dmRequests && dmRequests.length > 0 && (
                  <View>
                    <Text className="px-4 py-2 text-sm font-bold text-slate-500 uppercase tracking-wider">Message Requests</Text>
                    {dmRequests.map(req => <React.Fragment key={req.id}>{renderDmRequest({ item: req })}</React.Fragment>)}
                    <Text className="px-4 py-2 mt-2 text-sm font-bold text-slate-500 uppercase tracking-wider">Your Matches</Text>
                  </View>
                )}
                {hasNewMatches && (
                  <View className="mx-4 mt-4 mb-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-4 rounded-2xl flex-row items-center shadow-sm">
                    <View className="w-12 h-12 bg-white rounded-full items-center justify-center mr-3 shadow-sm border border-blue-100">
                      <Text className="text-2xl">🎉</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-blue-900 font-bold text-base mb-0.5">You have new matches!</Text>
                      <Text className="text-blue-700/80 text-sm">Say hi before the spark fades.</Text>
                    </View>
                  </View>
                )}
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
