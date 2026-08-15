import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface ActionRailProps {
  onLike: () => void;
  onPass: () => void;
  onDM: () => void;
}

export const ActionRail: React.FC<ActionRailProps> = ({ onLike, onPass, onDM }) => {
  return (
    <View className="absolute right-4 bottom-32 items-center gap-6">
      {/* Like Button */}
      <TouchableOpacity
        onPress={onLike}
        className="items-center justify-center bg-[#4A9B7F] w-14 h-14 rounded-full shadow-lg shadow-[#4A9B7F]/50"
        activeOpacity={0.8}
      >
        <Ionicons name="heart" size={28} color="#ffffff" />
      </TouchableOpacity>

      {/* Pass Button */}
      <TouchableOpacity
        onPress={onPass}
        className="items-center justify-center bg-white/20 w-12 h-12 rounded-full border border-white/30 backdrop-blur-md"
        activeOpacity={0.8}
      >
        <Ionicons name="close" size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* DM / Premium Button */}
      <View className="items-center">
        <TouchableOpacity
          onPress={onDM}
          className="items-center justify-center bg-[#1B4D5C] w-12 h-12 rounded-full shadow-md"
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubble-ellipses" size={22} color="#ffffff" />
          
          {/* Gold Star Badge for Premium */}
          <View className="absolute -top-1 -right-1 bg-[#D4784F] w-5 h-5 rounded-full items-center justify-center shadow-sm border border-[#1B4D5C]">
            <Ionicons name="star" size={10} color="#ffffff" />
          </View>
        </TouchableOpacity>
        <Text className="text-white text-[10px] font-bold mt-1 shadow-sm">DM</Text>
      </View>
    </View>
  );
};
