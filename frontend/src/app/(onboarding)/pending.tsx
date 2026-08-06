import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { verificationService } from '@/services/verification.service';
import { profileService } from '@/services/profile.service';
import { photoService } from '@/services/photo.service';
import { BlurredPhoto } from '@/components/photos/BlurredPhoto';
import { useAuthStore } from '@/state/auth.store';

export default function PendingScreen() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    // Fetch user's profile to get their uploaded photo
    const fetchProfile = async () => {
      try {
        const profile = await profileService.getProfile();
        if (profile.photos && profile.photos.length > 0) {
          const primaryPhoto = profile.photos.find((p: any) => p.isPrimary) || profile.photos[0];
          if (primaryPhoto && primaryPhoto.id) {
            const url = await photoService.getPhotoReadUrl(primaryPhoto.id);
            setPhotoUrl(url);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch profile photo for pending screen', err);
      }
    };

    fetchProfile();

    let interval: ReturnType<typeof setInterval>;

    const checkStatus = async () => {
      try {
        const { status } = await verificationService.checkStatus();
        
        if (status === 'approved') {
          clearInterval(interval);
          router.replace('/(tabs)/discover');
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
        <ActivityIndicator size="large" color="#1B4D5C" className="mb-4" />
        <Text className="text-2xl font-bold text-slate-900 mb-2 text-center">
          Verification Pending
        </Text>
        <Text className="text-slate-600 text-center mb-6 leading-relaxed">
          Our team is reviewing your documentation. This usually takes less than 24 hours. You'll be notified as soon as you're approved.
        </Text>

        {/* Photo Privacy Information */}
        <View className="w-full bg-slate-50 p-5 rounded-2xl border border-slate-200">
          <Text className="text-lg font-bold text-slate-900 mb-1">
            Photo Privacy
          </Text>
          <Text className="text-slate-600 text-xs mb-4 leading-normal">
            Your photos will be visible to other verified members by default. You can choose to blur them at any time from your privacy settings.
          </Text>

          {/* Photo Render */}
          <View className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-slate-200 relative justify-center items-center">
            {photoUrl ? (
              <BlurredPhoto
                blurhash="LEHV6nWB2yk8pyo0adR*.7kCMdnj"
                revealGranted={true}
                photoUrl={photoUrl}
              />
            ) : (
              <View className="items-center justify-center p-6">
                <Text className="text-6xl mb-4">👤</Text>
                <Text className="text-slate-500 font-medium text-center">
                  Your profile photo will appear here
                </Text>
              </View>
            )}
            
            {/* Status Overlay Badge */}
            <View className="absolute bottom-3 left-3 right-3 bg-black/70 p-3 rounded-lg">
              <Text className="text-white text-xs font-semibold text-center">
                ✨ Visible to other verified members by default
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
