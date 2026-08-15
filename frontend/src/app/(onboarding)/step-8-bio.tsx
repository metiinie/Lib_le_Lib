import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDraftProfileStore } from '@/state/draftProfile.store';
import { profileService } from '@/services/profile.service';
import { parseAndNormalizeDate } from '@/lib/zod-schemas';

const schema = z.object({
  bio: z.string().max(500).optional(),
});

export default function Step8BioScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { draft, updateDraft } = useDraftProfileStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      bio: draft.bio || '',
    },
  });

  const onSubmit = async (data: { bio?: string }) => {
    updateDraft(data);
    setIsSubmitting(true);
    try {
      const finalPayload = { ...draft, ...data };
      if (finalPayload.dateOfBirth) {
        const parsed = parseAndNormalizeDate(finalPayload.dateOfBirth);
        if (parsed) {
          finalPayload.dateOfBirth = parsed.normalized;
        }
      }
      await profileService.createProfile(finalPayload as any);
      router.push('/(onboarding)/step-9-photo');
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.error?.message || err?.response?.data?.message || 'Failed to save profile';
      Alert.alert('Validation Error', Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <KeyboardAwareScrollView 
        className="flex-1 bg-white px-6 pt-16"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
      >
        <Text className="text-3xl font-bold text-slate-900 mb-2">Almost there!</Text>
        <Text className="text-slate-500 mb-8">Tell us a bit about yourself.</Text>

        <View className="mb-6">
          <Text className="text-slate-700 font-semibold mb-2">Bio</Text>
          <Controller
            control={control}
            name="bio"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 h-32"
                placeholder="Share your interests, hobbies, or what makes you unique..."
                multiline
                textAlignVertical="top"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {errors.bio && <Text className="text-red-500 mt-1">{errors.bio.message as string}</Text>}
        </View>
      </KeyboardAwareScrollView>

      <View 
        style={{ 
          flexDirection: 'row',
          paddingHorizontal: 24, 
          paddingTop: 16, 
          paddingBottom: Math.max(insets.bottom, 24),
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9'
        }}
      >
        <TouchableOpacity
          className="bg-slate-100 p-4 rounded-xl items-center flex-1 mr-2"
          onPress={() => router.back()}
        >
          <Text className="text-slate-700 font-bold text-lg">Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="bg-[#1B4D5C] p-4 rounded-xl items-center flex-1 ml-2"
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          <Text className="text-white font-bold text-lg">{isSubmitting ? 'Saving...' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
