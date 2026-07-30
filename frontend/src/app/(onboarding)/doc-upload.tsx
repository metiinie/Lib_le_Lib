import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { photoService } from '@/services/photo.service';
import { verificationService } from '@/services/verification.service';

interface SelectedDocument {
  id: string;
  name: string;
  uri: string;
  mimeType: string;
  size?: number;
}

export default function DocUploadScreen() {
  const router = useRouter();
  const [documents, setDocuments] = useState<SelectedDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newDocs: SelectedDocument[] = result.assets.map((asset) => ({
          id: Math.random().toString(36).substring(7),
          name: asset.name,
          uri: asset.uri,
          mimeType: asset.mimeType || 'application/pdf',
          size: asset.size,
        }));

        setDocuments((prev) => [...prev, ...newDocs]);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const removeDocument = (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
  };

  const handleSubmit = async () => {
    if (documents.length === 0) {
      Alert.alert('Required', 'Please add at least one medical document.');
      return;
    }

    setIsUploading(true);
    try {
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        setUploadProgress(`Submitting document ${i + 1} of ${documents.length}...`);

        const docType = i === 0 ? 'primary_medical_doc' : 'supporting_doc';
        const { uploadUrl } = await verificationService.submitVerification(docType, doc.mimeType);

        if (uploadUrl) {
          await photoService.uploadToSignedUrl(uploadUrl, doc.uri, doc.mimeType);
        }
      }

      router.push('/(onboarding)/liveness');
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.message || 'Failed to submit verification documents. Please try again.';
      Alert.alert('Upload Error', msg);
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  return (
    <ScrollView className="flex-1 bg-white px-6 pt-16">
      <Text className="text-3xl font-bold text-slate-900 mb-2">Identity Verification</Text>
      <Text className="text-slate-600 mb-6 text-base leading-relaxed">
        To keep our community safe and verified, please attach your medical documentation. At least 1 document is required.
      </Text>

      <View className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-6">
        <Text className="text-amber-800 font-semibold mb-1">Privacy Notice</Text>
        <Text className="text-amber-700 text-sm">
          Please cover your patient ID number if preferred. We only verify the medical seal and your name.
        </Text>
      </View>

      {/* Selected Documents List */}
      <View className="mb-6">
        <Text className="text-slate-800 font-semibold mb-3 text-lg">
          Attached Documents ({documents.length})
        </Text>

        {documents.length === 0 ? (
          <View className="p-6 border-2 border-dashed border-slate-200 rounded-2xl items-center justify-center bg-slate-50 mb-4">
            <Text className="text-slate-500 font-medium mb-1 text-center">No documents attached yet</Text>
            <Text className="text-slate-400 text-xs text-center">Attach your main medical report or seal photo</Text>
          </View>
        ) : (
          documents.map((doc, index) => {
            const isRequired = index === 0;
            return (
              <View
                key={doc.id}
                className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-3 flex-row items-center justify-between"
              >
                <View className="flex-1 pr-3">
                  <View className="flex-row items-center mb-1">
                    <Text className="font-semibold text-slate-900 text-base" numberOfLines={1}>
                      {doc.name}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Text
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        isRequired
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isRequired ? 'Required Document' : 'Optional Document'}
                    </Text>
                    {doc.size ? (
                      <Text className="text-slate-400 text-xs">
                        {(doc.size / (1024 * 1024)).toFixed(2)} MB
                      </Text>
                    ) : null}
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => removeDocument(doc.id)}
                  className="p-2 rounded-lg bg-red-50 border border-red-100"
                  disabled={isUploading}
                >
                  <Text className="text-red-600 font-bold text-xs">Remove</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}

        {/* Add Document Button */}
        <TouchableOpacity
          onPress={pickDocument}
          className="border border-blue-600 bg-blue-50 py-3 rounded-xl items-center border-dashed"
          disabled={isUploading}
        >
          <Text className="text-blue-600 font-bold text-base">
            {documents.length === 0 ? '+ Select Primary Document' : '+ Add Another Document (Optional)'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        className={`bg-blue-600 p-4 rounded-xl items-center mt-4 mb-16 ${
          documents.length === 0 || isUploading ? 'opacity-50' : ''
        }`}
        onPress={handleSubmit}
        disabled={documents.length === 0 || isUploading}
      >
        {isUploading ? (
          <View className="flex-row items-center gap-2">
            <ActivityIndicator color="#fff" size="small" />
            <Text className="text-white font-bold text-lg">
              {uploadProgress || 'Uploading...'}
            </Text>
          </View>
        ) : (
          <Text className="text-white font-bold text-lg">Submit Verification Documents</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
