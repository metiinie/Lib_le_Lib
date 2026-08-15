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
  lookingFor: z.array(z.enum(['men', 'women', 'everyone'])).min(1, 'Select at least one option'),
});

const OPTIONS = [
  { label: 'Men', value: 'men' },
  { label: 'Women', value: 'women' },
  { label: 'Everyone', value: 'everyone' },
] as const;

export default function Step4LookingForScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { draft, updateDraft } = useDraftProfileStore();

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      lookingFor: draft.lookingFor || ['everyone'],
    },
  });

  const selected = watch('lookingFor') || [];

  const toggleOption = (val: 'men' | 'women' | 'everyone') => {
    let current = [...selected];
    if (val === 'everyone') {
      current = ['everyone'];
    } else {
      current = current.filter(x => x !== 'everyone');
      const idx = current.indexOf(val);
      if (idx > -1) {
        current.splice(idx, 1);
      } else {
        current.push(val);
      }
      if (current.length === 0) current = ['everyone'];
    }
    setValue('lookingFor', current, { shouldValidate: true });
  };

  const onSubmit = (data: { lookingFor: ('men' | 'women' | 'everyone')[] }) => {
    updateDraft(data);
    router.push('/(onboarding)/step-6-relationship-goals');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <KeyboardAwareScrollView 
        className="flex-1 bg-white px-6 pt-16"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-3xl font-bold text-slate-900 mb-2">Who are you looking for?</Text>
        <Text className="text-slate-500 mb-8">This determines who you will see in Discovery.</Text>

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
          {errors.lookingFor && <Text className="text-red-500 mt-2">{errors.lookingFor.message as string}</Text>}
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
