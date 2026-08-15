import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDraftProfileStore } from '@/state/draftProfile.store';

const schema = z.object({
  relationshipGoals: z
    .array(z.enum(['marriage', 'serious_relationship', 'friendship']))
    .min(1, 'Select at least one relationship goal'),
});

const OPTIONS = [
  { label: 'Marriage', value: 'marriage' },
  { label: 'Serious Relationship', value: 'serious_relationship' },
  { label: 'Friendship', value: 'friendship' },
] as const;

export default function Step5GoalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { draft, updateDraft } = useDraftProfileStore();

  const { handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      relationshipGoals: draft.relationshipGoals || [],
    },
  });

  const selected = watch('relationshipGoals') || [];

  const toggleOption = (val: 'marriage' | 'serious_relationship' | 'friendship') => {
    const current = [...selected];
    const idx = current.indexOf(val);
    if (idx > -1) {
      current.splice(idx, 1);
    } else {
      current.push(val);
    }
    setValue('relationshipGoals', current, { shouldValidate: true });
  };

  const onSubmit = (data: { relationshipGoals: string[] }) => {
    updateDraft(data);
    router.push('/(onboarding)/step-7-virus-type');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <KeyboardAwareScrollView 
        className="flex-1 bg-white px-6 pt-16"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-3xl font-bold text-slate-900 mb-2">What are your goals?</Text>
        <Text className="text-slate-500 mb-8">Select all that apply.</Text>

        <View className="mb-6">
          <View className="gap-3">
            {OPTIONS.map((opt) => {
              const isSelected = selected.includes(opt.value);
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => toggleOption(opt.value)}
                  className={`p-4 rounded-xl border ${
                    isSelected ? 'bg-[#1B4D5C] border-[#1B4D5C]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <Text className={`font-semibold text-lg ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {errors.relationshipGoals && <Text className="text-red-500 mt-2">{errors.relationshipGoals.message as string}</Text>}
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
