import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function MeetupSafetyScreen() {
  const router = useRouter();

  const handleShare = async () => {
    try {
      // Intentionally generic payload with no "Lib le Lib" app branding metadata
      await Share.share({
        message: "I am going on a date. I'll share my live location with you shortly.",
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View className="flex-1 bg-white pt-12 px-6">
      <View className="flex-row items-center mb-8">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mr-2">
          <Ionicons name="close" size={28} color="#0f172a" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-slate-900">Safety Checklist</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="items-center mb-8 mt-4">
          <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
            <Ionicons name="shield-checkmark" size={40} color="#208AEF" />
          </View>
          <Text className="text-center text-slate-600 px-4 leading-relaxed text-base">
            Planning to meet in person? Keep these safety tips in mind to ensure a secure and positive experience.
          </Text>
        </View>

        <View className="bg-slate-50 p-5 rounded-2xl mb-4 border border-slate-100">
          <View className="flex-row items-center mb-2">
            <Ionicons name="cafe" size={24} color="#0f172a" />
            <Text className="text-lg font-bold text-slate-900 ml-3">Meet in Public</Text>
          </View>
          <Text className="text-slate-600 pl-9">Always meet in a populated, public place like a café or restaurant for the first time.</Text>
        </View>

        <View className="bg-slate-50 p-5 rounded-2xl mb-4 border border-slate-100">
          <View className="flex-row items-center mb-2">
            <Ionicons name="people" size={24} color="#0f172a" />
            <Text className="text-lg font-bold text-slate-900 ml-3">Tell a Friend</Text>
          </View>
          <Text className="text-slate-600 pl-9">Let someone you trust know where you're going, who you're meeting, and when you plan to return.</Text>
        </View>

        <View className="bg-slate-50 p-5 rounded-2xl mb-8 border border-slate-100">
          <View className="flex-row items-center mb-2">
            <Ionicons name="car" size={24} color="#0f172a" />
            <Text className="text-lg font-bold text-slate-900 ml-3">Control Your Transport</Text>
          </View>
          <Text className="text-slate-600 pl-9">Drive yourself or use a ride-share app. Don't rely on your date for transportation early on.</Text>
        </View>

        <TouchableOpacity 
          className="w-full bg-blue-600 py-4 rounded-xl items-center flex-row justify-center shadow-sm mb-12"
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={20} color="#fff" />
          <Text className="text-white font-bold text-lg ml-2">Share Details Externally</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
