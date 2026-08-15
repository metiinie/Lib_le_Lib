import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDraftProfileStore } from '@/state/draftProfile.store';

const schema = z.object({
  nickname: z.string().min(2, 'Nickname must be at least 2 characters').max(30),
});

export default function Step1NicknameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { draft, updateDraft } = useDraftProfileStore();

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      nickname: draft.nickname || '',
    },
  });

  const onSubmit = (data: { nickname: string }) => {
    updateDraft(data);
    router.push('/(onboarding)/step-2-dob');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <KeyboardAwareScrollView 
        className="flex-1 bg-white px-6 pt-16"
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
      >
        <Text className="text-3xl font-bold text-slate-900 mb-2">What's your name?</Text>
        <Text className="text-slate-500 mb-8">This is how you will appear to other users.</Text>

        <View className="mb-6">
          <Text className="text-slate-700 font-semibold mb-2">Nickname</Text>
          <Controller
            control={control}
            name="nickname"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900"
                placeholder="How should we call you?"
                value={value}
                onChangeText={onChange}
                autoFocus
              />
            )}
          />
          {errors.nickname && <Text className="text-red-500 mt-1">{errors.nickname.message}</Text>}
        </View>
      </KeyboardAwareScrollView>

      <View 
        style={{ 
          paddingHorizontal: 24, 
          paddingTop: 16, 
          paddingBottom: Math.max(insets.bottom, 24),
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9'
        }}
      >
        <TouchableOpacity
          className="bg-[#1B4D5C] p-4 rounded-xl items-center"
          onPress={handleSubmit(onSubmit)}
        >
          <Text className="text-white font-bold text-lg">Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
