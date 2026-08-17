import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { photoService } from '@/services/photo.service';

export default function LivenessScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!permission) {
    return <View className="flex-1 bg-black" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-white px-6 justify-center items-center">
        <Text className="text-center text-lg text-slate-800 mb-6">
          We need camera access to verify your identity.
        </Text>
        <TouchableOpacity className="bg-blue-600 px-6 py-3 rounded-full" onPress={requestPermission}>
          <Text className="text-white font-bold">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current || isUploading) return;

    setIsUploading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
      });

      if (!photo) throw new Error('Capture failed');

      // Request short-lived signed URL
      const { uploadUrl } = await photoService.getUploadUrl('selfie');

      // Upload directly to object storage
      await photoService.uploadToSignedUrl(uploadUrl, photo.uri, 'image/jpeg');

      // Transition to pending state
      router.push('/(onboarding)/pending');
    } catch (err) {
      Alert.alert('Upload Failed', 'Failed to submit selfie. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="front"
      />

      <View className="absolute inset-x-0 top-16 px-6">
        <Text className="text-3xl font-bold text-white text-center shadow-lg">Liveness Check</Text>
        <Text className="text-white/90 text-center mt-2 font-medium">
          Take a quick selfie to verify it's really you.
        </Text>
      </View>

      <View className="absolute inset-x-0 bottom-12 items-center">
        <TouchableOpacity
          className={`w-20 h-20 rounded-full border-4 border-white bg-white/30 items-center justify-center ${isUploading ? 'opacity-50' : ''}`}
          onPress={takePicture}
          disabled={isUploading}
        >
          <View className="w-16 h-16 rounded-full bg-white" />
        </TouchableOpacity>
        {isUploading && <Text className="text-white mt-4 font-semibold">Verifying securely...</Text>}
      </View>
    </View>
  );
}
