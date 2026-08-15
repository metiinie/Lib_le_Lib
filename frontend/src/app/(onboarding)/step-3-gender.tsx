import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDraftProfileStore } from '@/state/draftProfile.store';

const schema = z.object({
  gender: z.enum(['man', 'woman', 'other']),
});

export default function Step3GenderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { draft, updateDraft } = useDraftProfileStore();

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      gender: draft.gender || 'man',
    },
  });

  const onSubmit = (data: { gender: 'man' | 'woman' | 'other' }) => {
    updateDraft(data);
    router.push('/(onboarding)/step-4-region');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <KeyboardAwareScrollView 
        className="flex-1 bg-white px-6 pt-16"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-3xl font-bold text-slate-900 mb-2">How do you identify?</Text>
        <Text className="text-slate-500 mb-8">This helps us understand you better.</Text>

        <View className="mb-6">
          <Controller
            control={control}
            name="gender"
            render={({ field: { onChange, value } }) => (
              <View className="gap-3">
                {['man', 'woman', 'other'].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => onChange(opt)}
                    className={`p-4 rounded-xl border ${
                      value === opt ? 'bg-[#1B4D5C] border-[#1B4D5C]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <Text className={`font-semibold text-lg ${value === opt ? 'text-white' : 'text-slate-700 capitalize'}`}>
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
          {errors.gender && <Text className="text-red-500 mt-2">{errors.gender.message as string}</Text>}
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
        >
          <Text className="text-white font-bold text-lg">Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
