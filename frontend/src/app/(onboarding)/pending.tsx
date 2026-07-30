import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { verificationService } from '@/services/verification.service';
import { BlurredPhoto } from '@/components/photos/BlurredPhoto';
import { useAuthStore } from '@/state/auth.store';

export default function PendingScreen() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const [activeTab, setActiveTab] = useState<'owner' | 'others'>('owner');

  useEffect(() => {
    // Don't start polling until the auth token has hydrated from SecureStore.
    // Without this guard, the first poll fires with no Authorization header,
    // gets a 401, and the interceptor logs the user out.
    if (!token) return;

    let interval: ReturnType<typeof setInterval>;

    const checkStatus = async () => {
      try {
        const { status } = await verificationService.checkStatus();
        
        if (status === 'approved') {
          clearInterval(interval);
          router.replace('/(main)/discovery');
        } else if (status === 'rejected') {
          clearInterval(interval);
          router.replace('/(onboarding)/rejected');
        }
      } catch (err) {
        console.error('Failed to poll status', err);
      }
    };

    interval = setInterval(checkStatus, 5000);
    checkStatus();

    return () => clearInterval(interval);
  }, [token]);

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="px-6 pt-20 pb-12 items-center">
        <ActivityIndicator size="large" color="#208AEF" className="mb-4" />
        <Text className="text-2xl font-bold text-slate-900 mb-2 text-center">
          Verification Pending
        </Text>
        <Text className="text-slate-600 text-center mb-6 leading-relaxed">
          Our team is reviewing your documentation. This usually takes less than 24 hours. You'll be notified as soon as you're approved.
        </Text>

        {/* Privacy & Photo Mechanics Interactive Preview */}
        <View className="w-full bg-slate-50 p-5 rounded-2xl border border-slate-200">
          <Text className="text-lg font-bold text-slate-900 mb-1">
            Photo Privacy Mechanics
          </Text>
          <Text className="text-slate-600 text-xs mb-4 leading-normal">
            As the photo owner, you always see your own photos unblurred. All other members see your photos blurred by default until you grant access.
          </Text>

          {/* View Switcher Tabs */}
          <View className="flex-row bg-slate-200 p-1 rounded-xl mb-4">
            <TouchableOpacity
              onPress={() => setActiveTab('owner')}
              className={`flex-1 py-2.5 rounded-lg items-center ${
                activeTab === 'owner' ? 'bg-white shadow-sm' : ''
              }`}
            >
              <Text
                className={`font-semibold text-xs ${
                  activeTab === 'owner' ? 'text-blue-600 font-bold' : 'text-slate-600'
                }`}
              >
                👁️ Your View (Unblurred)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('others')}
              className={`flex-1 py-2.5 rounded-lg items-center ${
                activeTab === 'others' ? 'bg-white shadow-sm' : ''
              }`}
            >
              <Text
                className={`font-semibold text-xs ${
                  activeTab === 'others' ? 'text-blue-600 font-bold' : 'text-slate-600'
                }`}
              >
                🔒 Others' View (Blurred)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Photo Render */}
          <View className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-slate-200 relative">
            <BlurredPhoto
              blurhash="LEHV6nWB2yk8pyo0adR*.7kCMdnj"
              revealGranted={activeTab === 'owner'} // Unblurred for owner, blurred for others
              photoUrl="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600"
            />
            
            {/* Status Overlay Badge */}
            <View className="absolute bottom-3 left-3 right-3 bg-black/70 p-3 rounded-lg">
              <Text className="text-white text-xs font-semibold text-center">
                {activeTab === 'owner'
                  ? '✨ Visible to you because you own this profile'
                  : '🔒 Permanently blurred to all other members by default'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
