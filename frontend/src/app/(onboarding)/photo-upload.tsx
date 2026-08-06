import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { photoService } from '@/services/photo.service';

export default function PhotoUploadScreen() {
  const router = useRouter();
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
      const { uploadUrl, storageRef } = await photoService.getUploadUrl('profile');
      if (uploadUrl) {
        await photoService.uploadToSignedUrl(uploadUrl, photoUri, 'image/jpeg');
        await photoService.registerPhoto(storageRef, true);
      }

      router.push('/(onboarding)/doc-upload');
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.message || 'Failed to upload photo.';
      Alert.alert('Upload Error', msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white px-6 pt-16">
      <Text className="text-3xl font-bold text-slate-900 mb-2">Profile Photo</Text>
      <Text className="text-slate-600 mb-6 text-base leading-relaxed">
        Upload a clear photo of yourself. This will be used as your main profile picture and to verify your identity against your documents and liveness check.
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
            className="w-full aspect-[3/4] border-2 border-dashed border-blue-200 bg-blue-50 rounded-2xl items-center justify-center"
          >
            <View className="bg-blue-100 p-4 rounded-full mb-4">
              <Text className="text-3xl">📸</Text>
            </View>
            <Text className="text-blue-700 font-bold text-lg mb-1">Upload Photo</Text>
            <Text className="text-blue-500 text-sm text-center px-4">
              Make sure your face is clearly visible
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        className={`bg-blue-600 p-4 rounded-xl items-center mt-4 mb-16 ${
          !photoUri || isUploading ? 'opacity-50' : ''
        }`}
        onPress={handleSubmit}
        disabled={!photoUri || isUploading}
      >
        {isUploading ? (
          <View className="flex-row items-center gap-2">
            <ActivityIndicator color="#fff" size="small" />
            <Text className="text-white font-bold text-lg">Uploading...</Text>
          </View>
        ) : (
          <Text className="text-white font-bold text-lg">Continue</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
