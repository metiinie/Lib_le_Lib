import React, { useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Match } from '@/services/match.service';
import { BlurredPhoto } from '@/components/photos/BlurredPhoto';
import { useMatches } from '@/hooks/useMatches';

export default function MatchesScreen() {
  const router = useRouter();
  const { data: matches, isLoading, isError, refetch, unmatch, block } = useMatches();

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

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 py-4 border-b border-slate-100">
        <Text className="text-2xl font-bold text-slate-900">Your Matches</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#208AEF" />
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
            <Ionicons name="chatbubble-outline" size={40} color="#94a3b8" />
          </View>
          <Text className="text-slate-900 text-xl font-bold text-center mb-2">No matches yet</Text>
          <Text className="text-slate-500 text-center text-base">Keep discovering to find new connections.</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          renderItem={renderMatch}
          ListHeaderComponent={
            hasNewMatches ? (
              <View className="mx-4 mt-4 mb-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-4 rounded-2xl flex-row items-center shadow-sm">
                <View className="w-12 h-12 bg-white rounded-full items-center justify-center mr-3 shadow-sm border border-blue-100">
                  <Text className="text-2xl">🎉</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-blue-900 font-bold text-base mb-0.5">You have new matches!</Text>
                  <Text className="text-blue-700/80 text-sm">Say hi before the spark fades.</Text>
                </View>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
