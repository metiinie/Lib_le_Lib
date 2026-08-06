import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';

export default function VideoCallScheduleScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();
  const [scheduled, setScheduled] = useState(false);

  const handleSchedule = async () => {
    try {
      // MVP: Meta-data scheduling only. No actual WebRTC track initiation.
      await api.post(`/calls/schedule`, { matchId });
      setScheduled(true);
      Alert.alert("Scheduled", "A video call request has been sent to your match.");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not schedule the call.");
    }
  };

  const handleCancel = () => {
    setScheduled(false);
  };

  return (
    <View className="flex-1 bg-white px-6 pt-16">
      <View className="flex-row items-center mb-12">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mr-4">
          <Ionicons name="close" size={28} color="#0F1E24" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-slate-900">Video Call</Text>
      </View>

      <View className="flex-1 justify-center items-center pb-20">
        <View className="w-24 h-24 rounded-full bg-indigo-100 items-center justify-center mb-6">
          <Ionicons name="videocam" size={48} color="#1B4D5C" />
        </View>

        <Text className="text-xl font-bold text-center text-slate-900 mb-4">
          Secure Video Date
        </Text>
        
        <Text className="text-center text-slate-600 mb-12 px-4 leading-relaxed">
          {scheduled 
            ? "Waiting for the other person to confirm the call schedule..." 
            : "Propose a video call. This helps verify identity and build trust before meeting in person."}
        </Text>

        {scheduled ? (
          <TouchableOpacity 
            className="w-full bg-slate-100 py-4 rounded-xl items-center"
            onPress={handleCancel}
          >
            <Text className="text-slate-700 font-bold text-lg">Cancel Request</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            className="w-full bg-indigo-600 py-4 rounded-xl items-center shadow-md"
            onPress={handleSchedule}
          >
            <Text className="text-white font-bold text-lg">Propose Call</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
