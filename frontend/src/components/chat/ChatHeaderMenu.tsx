import React, { useState } from 'react';
import { View, TouchableOpacity, Modal, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { safetyService } from '@/services/safety.service';

interface Props {
  matchId: string;
}

export function ChatHeaderMenu({ matchId }: Props) {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);

  const handleBlock = async () => {
    setMenuVisible(false);
    try {
      await safetyService.blockUser(matchId);
      // Optimistic update: kick user out of chat immediately
      router.replace('/(tabs)/matches');
    } catch (err) {
      console.error(err);
    }
  };

  const handleReport = () => {
    setMenuVisible(false);
    router.push(`/modals/report-${matchId}`);
  };

  const handleMeetupSafety = () => {
    setMenuVisible(false);
    router.push(`/modals/meetup-safety`);
  };

  return (
    <View>
      <TouchableOpacity onPress={() => setMenuVisible(true)} className="p-2 -mr-2">
        <Ionicons name="ellipsis-vertical" size={24} color="#EFF4F5" />
      </TouchableOpacity>

      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableOpacity 
          className="flex-1 bg-black/30 justify-start items-end pt-16 pr-4"
          activeOpacity={1} 
          onPress={() => setMenuVisible(false)}
        >
          <View className="bg-white rounded-xl shadow-lg w-56 overflow-hidden">
            <TouchableOpacity className="p-4 border-b border-slate-100 flex-row items-center" onPress={handleMeetupSafety}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#1B4D5C" />
              <Text className="ml-3 text-slate-800 font-medium text-base">Plan to meet</Text>
            </TouchableOpacity>

            <TouchableOpacity className="p-4 border-b border-slate-100 flex-row items-center" onPress={handleReport}>
              <Ionicons name="flag-outline" size={20} color="#D4784F" />
              <Text className="ml-3 text-slate-800 font-medium text-base">Report User</Text>
            </TouchableOpacity>

            <TouchableOpacity className="p-4 flex-row items-center" onPress={handleBlock}>
              <Ionicons name="ban" size={20} color="#B84C4C" />
              <Text className="ml-3 text-red-600 font-medium text-base">Block User</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
