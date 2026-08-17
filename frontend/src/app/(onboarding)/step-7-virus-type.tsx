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
  virusType: z.string().min(1, 'Please select an option'),
});

const OPTIONS = [
  { label: 'HIV-1', value: 'HIV-1' },
  { label: 'HIV-2', value: 'HIV-2' },
  { label: 'Both', value: 'Both' },
  { label: 'Unknown / Prefer not to say', value: 'prefer_not_to_say' },
] as const;

export default function Step6VirusTypeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { draft, updateDraft } = useDraftProfileStore();

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      virusType: draft.virusType || '',
    },
  });

  const onSubmit = (data: { virusType: string }) => {
    updateDraft(data);
    router.push('/(onboarding)/step-8-bio');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <KeyboardAwareScrollView
        className="flex-1 bg-white px-6 pt-16"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-3xl font-bold text-slate-900 mb-2">Virus Type</Text>
        <Text className="text-slate-500 mb-8">This information is securely encrypted and kept private until you match with someone.</Text>

        <View className="mb-6">
          <Controller
            control={control}
            name="virusType"
            render={({ field: { onChange, value } }) => (
              <View className="gap-3">
                {OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => onChange(opt.value)}
                    className={`p-4 rounded-xl border ${value === opt.value ? 'bg-[#1B4D5C] border-[#1B4D5C]' : 'bg-slate-50 border-slate-200'
                      }`}
                  >
                    <Text className={`font-semibold text-lg ${value === opt.value ? 'text-white' : 'text-slate-700'}`}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
          {errors.virusType && <Text className="text-red-500 mt-2">{errors.virusType.message as string}</Text>}
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
