import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { accountService } from '@/services/account.service';

export default function SubscriptionScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      await accountService.purchaseSubscription('premium_monthly');
      Alert.alert('Success', 'Welcome to Premium!');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      await accountService.restorePurchases();
      Alert.alert('Restored', 'Your purchases have been restored.');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white pt-16 px-6">
      <View className="flex-row items-center mb-8">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mr-4">
          <Ionicons name="close" size={28} color="#0f172a" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-slate-900">Lib le Lib Premium</Text>
      </View>

      <View className="bg-slate-50 border border-slate-100 rounded-3xl p-6 mb-6">
        <Text className="text-xl font-bold text-slate-900 mb-4">Free Plan</Text>
        <View className="flex-row items-center mb-2"><Ionicons name="checkmark" color="#22c55e" size={20} /><Text className="ml-2 text-slate-600">Discover grid</Text></View>
        <View className="flex-row items-center mb-2"><Ionicons name="checkmark" color="#22c55e" size={20} /><Text className="ml-2 text-slate-600">End-to-End Encrypted Chat</Text></View>
        <View className="flex-row items-center"><Ionicons name="checkmark" color="#22c55e" size={20} /><Text className="ml-2 text-slate-600">Q&A with Health Professionals</Text></View>
      </View>

      <View className="bg-indigo-50 border border-indigo-200 rounded-3xl p-6 mb-8">
        <Text className="text-xl font-bold text-indigo-900 mb-1">Premium Plan</Text>
        <Text className="text-indigo-600 font-bold mb-4">ETB 500 / month</Text>
        <View className="flex-row items-center mb-2"><Ionicons name="star" color="#4f46e5" size={20} /><Text className="ml-2 text-indigo-800 font-medium">See who liked you</Text></View>
        <View className="flex-row items-center mb-2"><Ionicons name="star" color="#4f46e5" size={20} /><Text className="ml-2 text-indigo-800 font-medium">Advanced filtering</Text></View>
        <View className="flex-row items-center"><Ionicons name="star" color="#4f46e5" size={20} /><Text className="ml-2 text-indigo-800 font-medium">Read receipts</Text></View>
      </View>

      <TouchableOpacity 
        className="w-full bg-indigo-600 py-4 rounded-xl items-center mb-4 shadow-sm"
        onPress={handlePurchase}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">Subscribe Now</Text>}
      </TouchableOpacity>

      <TouchableOpacity className="py-4 items-center" onPress={handleRestore}>
        <Text className="text-slate-500 font-semibold">Restore Purchases</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
