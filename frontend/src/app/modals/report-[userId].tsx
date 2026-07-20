import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { safetyService, ReportCategory } from '@/services/safety.service';

export default function ReportScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  
  const [category, setCategory] = useState<ReportCategory>('harassment');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await safetyService.submitReport(userId, {
        category,
        description: description.trim() || undefined,
      });
      Alert.alert(
        "Report Submitted",
        "Our moderation team will review this immediately. For your safety, you may also want to block this user.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (err) {
      Alert.alert("Error", "Failed to submit report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-slate-50 px-6 pt-12 pb-8">
      <View className="flex-row items-center mb-8">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mr-2">
          <Ionicons name="close" size={28} color="#0f172a" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-slate-900">Report User</Text>
      </View>

      <Text className="text-slate-600 mb-6 text-base leading-relaxed">
        We take reports very seriously. Please let us know why you are reporting this account. This action is completely anonymous.
      </Text>

      <View className="mb-6">
        <Text className="text-slate-700 font-semibold mb-2">Reason</Text>
        <View className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <Picker
            selectedValue={category}
            onValueChange={(val) => setCategory(val as ReportCategory)}
          >
            <Picker.Item label="Harassment" value="harassment" />
            <Picker.Item label="Fake Profile" value="fake_profile" />
            <Picker.Item label="Outing Threat" value="outing_threat" />
            <Picker.Item label="Solicitation" value="solicitation" />
            <Picker.Item label="Scam" value="scam" />
            <Picker.Item label="Underage Suspicion" value="underage_suspicion" />
            <Picker.Item label="Other" value="other" />
          </Picker>
        </View>
      </View>

      <View className="mb-6">
        <Text className="text-slate-700 font-semibold mb-2">Details (Optional)</Text>
        <TextInput
          className="bg-white border border-slate-200 rounded-xl p-4 text-slate-900 h-32"
          placeholder="Provide any additional context to help our moderators..."
          placeholderTextColor="#94a3b8"
          multiline
          textAlignVertical="top"
          value={description}
          onChangeText={setDescription}
        />
      </View>

      <View className="mb-8">
        <Text className="text-slate-700 font-semibold mb-2">Evidence (Optional)</Text>
        <TouchableOpacity className="bg-slate-100 border border-slate-200 border-dashed rounded-xl p-4 items-center flex-row justify-center h-16">
          <Ionicons name="camera-outline" size={24} color="#64748b" />
          <Text className="text-slate-600 font-medium ml-2">Attach Screenshot or Photo</Text>
        </TouchableOpacity>
        <Text className="text-slate-400 text-xs mt-2">Only moderators will see this attachment.</Text>
      </View>

      <TouchableOpacity 
        className="w-full bg-red-600 py-4 rounded-xl items-center flex-row justify-center shadow-sm"
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="flag" size={20} color="#fff" />
            <Text className="text-white font-bold text-lg ml-2">Submit Report</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
