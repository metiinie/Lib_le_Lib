import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { verificationService } from '@/services/verification.service';
import { BlurredPhoto } from '@/components/photos/BlurredPhoto';

export default function PendingScreen() {
  const router = useRouter();
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const checkStatus = async () => {
      try {
        const { status } = await verificationService.checkStatus();
        
        if (status === 'approved') {
          clearInterval(interval);
          router.replace('/(main)/discovery'); // Assumes main app routing
        } else if (status === 'rejected') {
          clearInterval(interval);
          router.replace('/(onboarding)/rejected');
        }
      } catch (err) {
        console.error('Failed to poll status', err);
      }
    };

    // Poll every 5 seconds
    interval = setInterval(checkStatus, 5000);
    checkStatus(); // Initial check

    return () => clearInterval(interval);
  }, []);

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="px-6 pt-24 pb-8 items-center">
        <ActivityIndicator size="large" color="#208AEF" className="mb-6" />
        <Text className="text-2xl font-bold text-slate-900 mb-2 text-center">
          Verification Pending
        </Text>
        <Text className="text-slate-600 text-center mb-10 leading-relaxed">
          Our team is reviewing your documentation. This usually takes less than 24 hours. You'll be notified as soon as you're approved.
        </Text>

        <View className="w-full bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <Text className="text-lg font-semibold text-slate-800 mb-4">How your photos appear</Text>
          <Text className="text-slate-600 mb-6 text-sm">
            While you wait, here's a preview of the privacy mechanics. By default, your photos are permanently blurred to everyone.
          </Text>
          
          <View className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-slate-200">
            <BlurredPhoto 
              blurhash="LEHV6nWB2yk8pyo0adR*.7kCMdnj" // Sample valid blurhash
              revealGranted={false} // Hardcoded false for preview/pending state
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
