import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { photoService } from '@/services/photo.service';

export default function DocUploadScreen() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await handleUpload(result.assets[0]);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleUpload = async (asset: DocumentPicker.DocumentPickerAsset) => {
    setIsUploading(true);
    try {
      // Request short-lived signed URL
      const uploadUrl = await photoService.getUploadUrl('document');
      
      // Upload directly to object storage via PUT
      await photoService.uploadToSignedUrl(uploadUrl, asset.uri, asset.mimeType);

      // Transition to liveness selfie check
      router.push('/(onboarding)/liveness');
    } catch (err) {
      Alert.alert('Upload Failed', 'Failed to upload document to secure storage. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View className="flex-1 bg-white px-6 pt-16">
      <Text className="text-3xl font-bold text-slate-900 mb-4">Identity Verification</Text>
      <Text className="text-slate-600 mb-8 text-base leading-relaxed">
        To keep our community safe and verified, please upload a clear photo or PDF of your medical documentation.
      </Text>

      <View className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-8">
        <Text className="text-amber-800 font-semibold mb-1">Privacy Notice</Text>
        <Text className="text-amber-700 text-sm">
          Please cover your patient ID number if preferred. We only need to verify the medical seal and your name.
        </Text>
      </View>

      <TouchableOpacity
        className={`bg-blue-600 p-4 rounded-xl items-center mt-auto mb-12 ${isUploading ? 'opacity-50' : ''}`}
        onPress={pickDocument}
        disabled={isUploading}
      >
        <Text className="text-white font-bold text-lg">{isUploading ? 'Uploading securely...' : 'Select Document'}</Text>
      </TouchableOpacity>
    </View>
  );
}
