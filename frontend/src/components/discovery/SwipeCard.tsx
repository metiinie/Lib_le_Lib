import React from 'react';
import { View, Text, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DiscoveryProfile } from '@/services/discovery.service';
import { BlurredPhoto } from '@/components/photos/BlurredPhoto';
import { ActionRail } from './ActionRail';
import { useRouter } from 'expo-router';

interface SwipeCardProps {
  profile: DiscoveryProfile;
  onLike: () => void;
  onPass: () => void;
  onDM: () => void;
}

const { width, height } = Dimensions.get('window');

export const SwipeCard: React.FC<SwipeCardProps> = ({ profile, onLike, onPass, onDM }) => {
  const router = useRouter();
  const primaryPhoto = profile.photos?.[0];

  return (
    <View className="w-full flex-1 bg-slate-900 relative">
      <TouchableOpacity
        activeOpacity={0.95}
        style={{ flex: 1 }}
        onPress={() => router.push(`/profiles/${profile.id}`)}
      >
        <BlurredPhoto
          blurhash={primaryPhoto?.blurhash || 'LEHV6nWB2yk8pyo0adR*.7kCMdnj'}
          revealGranted={true}
          photoUrl={primaryPhoto?.url}
        />

        {/* Bottom Gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(15,30,36,0.6)', 'rgba(15,30,36,0.95)']}
          className="absolute bottom-0 left-0 right-0 pt-32 pb-24 px-6"
          pointerEvents="none"
        >
          <View className="flex-row items-center flex-wrap mb-1">
            <Text className="text-white font-bold text-4xl mr-2 shadow-sm">
              {profile.nickname}, {profile.age}
            </Text>
            {/* Verified Badge */}
            <Ionicons name="checkmark-circle" size={24} color="#4A9B7F" />
          </View>

          <Text className="text-white/90 text-lg mb-4 font-medium shadow-sm">
            <Ionicons name="location" size={16} color="#4A7A8A" /> {profile.region}
          </Text>

          <View className="flex-row flex-wrap gap-2 mb-4">
            {profile.relationshipGoals?.map((goal, idx) => (
              <View key={idx} className="bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
                <Text className="text-white text-sm font-semibold capitalize">
                  {goal.replace('_', ' ')}
                </Text>
              </View>
            ))}
          </View>

          {profile.bio ? (
            <Text className="text-white/80 text-base leading-relaxed" numberOfLines={3}>
              {profile.bio}
            </Text>
          ) : null}
        </LinearGradient>
      </TouchableOpacity>

      {/* Action Rail on the right */}
      <ActionRail onLike={onLike} onPass={onPass} onDM={onDM} />
    </View>
  );
};
