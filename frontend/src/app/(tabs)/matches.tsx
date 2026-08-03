import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Match } from '@/services/match.service';
import { BlurredPhoto } from '@/components/photos/BlurredPhoto';
import { useMatches } from '@/hooks/useMatches';

export default function MatchesScreen() {
  const router = useRouter();
  const { data: matches, isLoading, isError, refetch } = useMatches();

  const renderMatch = ({ item }: { item: Match }) => (
    <TouchableOpacity
      className="flex-row items-center p-4 border-b border-slate-100 active:bg-slate-50"
      onPress={() => router.push(`/chat/${item.id}`)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Chat with ${item.matchedUserNickname}`}
    >
      <View className="w-16 h-16 rounded-full overflow-hidden bg-slate-200 mr-4">
        <BlurredPhoto
          blurhash={item.avatarBlurhash}
          revealGranted={true} // Photos are unblurred by default for verified users
          photoUrl={item.avatarUrl}
        />
      </View>
      <View className="flex-1 justify-center">
        <Text className="text-lg font-bold text-slate-900 mb-1">{item.matchedUserNickname}</Text>
        {/* Security Feature: Never display plain text payload from API. Always default to generic "New message" until chat screen is open */}
        <Text className="text-slate-500 font-medium" numberOfLines={1}>
          {item.lastMessageEncryptedPreview ? 'New message' : 'Tap to start chatting'}
        </Text>
      </View>
    </TouchableOpacity>
  );

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
          <Text className="text-slate-500 text-center text-lg">No matches yet. Keep discovering!</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          renderItem={renderMatch}
        />
      )}
    </View>
  );
}
