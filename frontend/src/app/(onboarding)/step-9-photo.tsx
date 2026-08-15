import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { photoService } from '@/services/photo.service';
import { profileService } from '@/services/profile.service';
import { useDraftProfileStore } from '@/state/draftProfile.store';
import { parseAndNormalizeDate } from '@/lib/zod-schemas';

export default function Step8PhotoScreen() {
  const router = useRouter();
  const { draft, clearDraft } = useDraftProfileStore();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSubmit = async () => {
    if (!photoUri) {
      Alert.alert('Required', 'Please select a profile photo.');
      return;
    }

    setIsUploading(true);
    try {
      // 1. Create the profile first using the gathered draft
      const finalPayload = { ...draft };
      if (finalPayload.dateOfBirth) {
        const parsed = parseAndNormalizeDate(finalPayload.dateOfBirth);
        if (parsed) {
          finalPayload.dateOfBirth = parsed.normalized;
        }
      }

      try {
        await profileService.createProfile(finalPayload as any);
      } catch (err: any) {
        const errCode = err?.response?.data?.error?.code;
        const errStatus = err?.response?.status;
        if (errStatus === 409 || errCode === 'PROFILE_EXISTS') {
          await profileService.updateProfile(finalPayload as any);
        } else {
          throw err;
        }
      }

      // 2. Upload the photo
      const { uploadUrl, storageRef } = await photoService.getUploadUrl('profile');
      if (uploadUrl) {
        await photoService.uploadToSignedUrl(uploadUrl, photoUri, 'image/jpeg');
        await photoService.registerPhoto(storageRef, true);
      }

      clearDraft();
      router.push('/(onboarding)/doc-upload');
    } catch (err: any) {
      let msg = err?.response?.data?.error?.message || err?.response?.data?.message || err?.message || 'Failed to upload photo or create profile.';
      if (Array.isArray(msg)) {
        msg = msg.join('\n');
      }
      Alert.alert('Error', msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white px-6 pt-16">
      <Text className="text-3xl font-bold text-slate-900 mb-2">Profile Photo</Text>
      <Text className="text-slate-600 mb-6 text-base leading-relaxed">
        Upload a clear photo of yourself. This will be used as your main profile picture and to verify your identity.
      </Text>

      <View className="mb-6 items-center">
        {photoUri ? (
          <View className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden border border-slate-200">
            <Image
              source={{ uri: photoUri }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
            <TouchableOpacity
              onPress={() => setPhotoUri(null)}
              className="absolute top-4 right-4 bg-black/60 p-2 rounded-full"
            >
              <Text className="text-white text-xs font-bold px-2">Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={pickImage}
            className="w-full aspect-[3/4] border-2 border-dashed border-[#1B4D5C] bg-slate-50 rounded-2xl items-center justify-center"
          >
            <View className="bg-slate-100 p-4 rounded-full mb-4">
              <Text className="text-3xl">📸</Text>
            </View>
            <Text className="text-[#1B4D5C] font-bold text-lg mb-1">Upload Photo</Text>
            <Text className="text-slate-500 text-sm text-center px-4">
              Make sure your face is clearly visible
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View className="flex-row mt-4 mb-16">
        <TouchableOpacity
          className="bg-slate-100 p-4 rounded-xl items-center flex-1 mr-2"
          onPress={() => router.back()}
          disabled={isUploading}
        >
          <Text className="text-slate-700 font-bold text-lg">Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`bg-[#1B4D5C] p-4 rounded-xl items-center flex-1 ml-2 ${
            !photoUri || isUploading ? 'opacity-50' : ''
          }`}
          onPress={handleSubmit}
          disabled={!photoUri || isUploading}
        >
          {isUploading ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color="#fff" size="small" />
              <Text className="text-white font-bold text-lg">Finishing...</Text>
            </View>
          ) : (
            <Text className="text-white font-bold text-lg">Complete</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
