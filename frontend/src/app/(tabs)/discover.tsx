import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { discoveryService, DiscoveryProfile } from '@/services/discovery.service';
import { BlurredPhoto } from '@/components/photos/BlurredPhoto';

export default function DiscoverScreen() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<DiscoveryProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const data = await discoveryService.getProfiles();
      setProfiles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: DiscoveryProfile }) => (
    <TouchableOpacity
      className="flex-1 m-2 aspect-[3/4] bg-slate-100 rounded-2xl overflow-hidden shadow-sm min-h-[48px] min-w-[48px]"
      onPress={() => router.push(`/profiles/${item.id}`)}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={`View profile of ${item.nickname}, ${item.age} years old from ${item.region}`}
    >
      <BlurredPhoto
        blurhash={item.photos[0]?.blurhash || 'LEHV6nWB2yk8pyo0adR*.7kCMdnj'}
        revealGranted={item.photos[0]?.revealGranted || false}
        photoUrl={item.photos[0]?.url}
      />
      <View className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent pt-12">
        <Text className="text-white font-bold text-lg">{item.nickname}, {item.age}</Text>
        <Text className="text-white/80 text-sm">{item.region}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 pt-4 pb-2 flex-row justify-between items-center border-b border-slate-100">
        <Text className="text-2xl font-bold text-slate-900">Discover</Text>
        <TouchableOpacity 
          className="bg-slate-100 px-4 py-2 rounded-full min-h-[48px] min-w-[48px] justify-center items-center"
          accessibilityRole="button"
          accessibilityLabel="Filter profiles"
        >
          <Text className="text-slate-700 font-semibold text-sm">Filters</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#208AEF" />
        </View>
      ) : (
        <FlatList
          data={profiles}
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
