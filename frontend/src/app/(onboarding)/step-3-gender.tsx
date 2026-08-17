import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useDraftProfileStore } from '@/state/draftProfile.store';

const schema = z.object({
  gender: z.enum(['man', 'woman']),
});

export default function Step3GenderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { draft, updateDraft } = useDraftProfileStore();

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      gender: (draft.gender === 'woman' ? 'woman' : 'man') as 'man' | 'woman',
    },
  });

  const onSubmit = (data: { gender: 'man' | 'woman' }) => {
    updateDraft(data);
    router.push('/(onboarding)/step-4-region');
  };

  const options: Array<{ id: 'man' | 'woman'; label: string; icon: keyof typeof Ionicons.glyphMap; description: string }> = [
    { id: 'man', label: 'Man', icon: 'male-outline', description: 'I identify as a man' },
    { id: 'woman', label: 'Woman', icon: 'female-outline', description: 'I identify as a woman' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <KeyboardAwareScrollView
        className="flex-1 bg-white px-6 pt-12"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Icon */}
        <View className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 items-center justify-center mb-6">
          <Ionicons name="person-outline" size={32} color="#1B4D5C" />
        </View>

        <Text className="text-3xl font-bold text-slate-900 mb-2">How do you identify?</Text>
        <Text className="text-slate-500 mb-8">Please select your gender identity.</Text>

        <View className="mb-6">
          <Controller
            control={control}
            name="gender"
            render={({ field: { onChange, value } }) => (
              <View className="gap-4">
                {options.map((opt) => {
                  const isSelected = value === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => onChange(opt.id)}
                      className={`p-5 rounded-2xl border flex-row items-center justify-between ${isSelected
                          ? 'bg-teal-50/70 border-[#1B4D5C]'
                          : 'bg-slate-50 border-slate-200'
                        }`}
                    >
                      <View className="flex-row items-center flex-1">
                        <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${isSelected ? 'bg-[#1B4D5C]' : 'bg-slate-200'
                          }`}>
                          <Ionicons
                            name={opt.icon}
                            size={24}
                            color={isSelected ? '#FFFFFF' : '#4A7A8A'}
                          />
                        </View>
                        <View className="flex-1">
                          <Text className={`font-bold text-xl ${isSelected ? 'text-[#1B4D5C]' : 'text-slate-800'}`}>
                            {opt.label}
                          </Text>
                          <Text className="text-slate-500 text-xs mt-0.5">
                            {opt.description}
                          </Text>
                        </View>
                      </View>

                      <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${isSelected ? 'border-[#1B4D5C] bg-[#1B4D5C]' : 'border-slate-300 bg-white'
                        }`}>
                        {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          />
          {errors.gender && <Text className="text-red-500 mt-2 font-medium">{errors.gender.message as string}</Text>}
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
