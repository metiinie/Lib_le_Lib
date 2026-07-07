import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { matchService, Match } from '@/services/match.service';
import { BlurredPhoto } from '@/components/photos/BlurredPhoto';

export default function MatchesScreen() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const data = await matchService.getMatches();
        setMatches(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  const renderMatch = ({ item }: { item: Match }) => (
    <TouchableOpacity className="flex-row items-center p-4 border-b border-slate-100 active:bg-slate-50">
      <View className="w-16 h-16 rounded-full overflow-hidden bg-slate-200 mr-4">
        <BlurredPhoto
          blurhash={item.avatarBlurhash}
          revealGranted={item.revealGranted}
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

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#208AEF" />
        </View>
      ) : matches.length === 0 ? (
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
