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
  fullName: z.string().min(2, 'Legal full name must be at least 2 characters').max(60),
  nickname: z.string().min(2, 'Nickname must be at least 2 characters').max(30),
});

type FormValues = z.infer<typeof schema>;

export default function Step1NicknameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { draft, updateDraft } = useDraftProfileStore();

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: draft.fullName || '',
      nickname: draft.nickname || '',
    },
  });

  const onSubmit = (data: FormValues) => {
    updateDraft(data);
    router.push('/(onboarding)/step-2-dob');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <KeyboardAwareScrollView
        className="flex-1 bg-white px-6 pt-12"
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
      >
        <Text className="text-3xl font-bold text-slate-900 mb-2">Welcome to Lib le Lib</Text>
        <Text className="text-slate-500 mb-8">Please provide your details below to set up your identity and verification.</Text>

        {/* Legal Full Name Input */}
        <View className="mb-6">
          <Text className="text-slate-900 font-semibold text-base mb-1">Legal Full Name</Text>
          <Text className="text-xs text-slate-500 mb-2">
            Required for medical verification only. Kept strictly private and never shown to other members.
          </Text>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-base"
                placeholder="e.g. Johnathan Alexander Doe"
                placeholderTextColor="#94a3b8"
                value={value}
                onChangeText={onChange}
                autoFocus
              />
            )}
          />
          {errors.fullName && <Text className="text-red-500 mt-1.5 text-sm">{errors.fullName.message}</Text>}
        </View>

        {/* Public Display Nickname Input */}
        <View className="mb-6">
          <Text className="text-slate-900 font-semibold text-base mb-1">What would you like us to call you?</Text>
          <Text className="text-xs text-slate-500 mb-2">
            This is your public display name seen by other members in Discover and Chat.
          </Text>
          <Controller
            control={control}
            name="nickname"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-base"
                placeholder="e.g. Alex"
                placeholderTextColor="#94a3b8"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {errors.nickname && <Text className="text-red-500 mt-1.5 text-sm">{errors.nickname.message}</Text>}
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
