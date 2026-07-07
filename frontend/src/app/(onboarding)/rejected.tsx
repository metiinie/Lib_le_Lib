import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { verificationService } from '@/services/verification.service';

export default function RejectedScreen() {
  const router = useRouter();
  const [reason, setReason] = useState<string>('We could not verify your medical documentation.');

  useEffect(() => {
    // Fetch rejection reason
    verificationService.checkStatus().then((res) => {
      if (res.rejection_reason) {
        setReason(res.rejection_reason);
      }
    }).catch(console.error);
  }, []);

  return (
    <View className="flex-1 bg-white px-6 pt-24">
      <View className="bg-red-50 border border-red-200 p-6 rounded-2xl mb-8">
        <Text className="text-red-800 text-xl font-bold mb-2">Verification Rejected</Text>
        <Text className="text-red-700 leading-relaxed">
          {reason}
        </Text>
      </View>

      <Text className="text-slate-600 mb-12 leading-relaxed">
        Don't worry! You can resubmit your documentation. Please make sure the photo is clear and the medical seal is fully visible.
      </Text>

      <TouchableOpacity
        className="bg-slate-900 p-4 rounded-xl items-center mt-auto mb-12"
        onPress={() => router.replace('/(onboarding)/doc-upload')}
      >
        <Text className="text-white font-bold text-lg">Resubmit Documentation</Text>
      </TouchableOpacity>
    </View>
  );
}
