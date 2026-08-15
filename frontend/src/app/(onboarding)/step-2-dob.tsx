import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDraftProfileStore } from '@/state/draftProfile.store';
import { parseAndNormalizeDate, is18OrOlder } from '@/lib/zod-schemas';

const schema = z.object({
  dateOfBirth: z.string().refine((val) => {
    return parseAndNormalizeDate(val) !== null;
  }, {
    message: 'Please enter a valid date or birth year (e.g. 1996 or YYYY-MM-DD).',
  }).refine((val) => {
    return is18OrOlder(val);
  }, {
    message: 'You must be at least 18 years old to use this app.',
  }),
});

export default function Step2DobScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { draft, updateDraft } = useDraftProfileStore();

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      dateOfBirth: draft.dateOfBirth || '',
    },
  });

  const onSubmit = (data: { dateOfBirth: string }) => {
    const parsed = parseAndNormalizeDate(data.dateOfBirth);
    updateDraft({ dateOfBirth: parsed ? parsed.normalized : data.dateOfBirth });
    router.push('/(onboarding)/step-3-gender');
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
        <Text className="text-3xl font-bold text-slate-900 mb-2">When were you born?</Text>
        <Text className="text-slate-500 mb-8">This helps us find appropriate matches for you.</Text>

        <View className="mb-6">
          <Text className="text-slate-700 font-semibold mb-2">Date of Birth</Text>
          <Controller
            control={control}
            name="dateOfBirth"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900"
                placeholder="YYYY-MM-DD or YYYY"
                value={value}
                onChangeText={onChange}
                autoFocus
              />
            )}
          />
          {errors.dateOfBirth && <Text className="text-red-500 mt-1">{errors.dateOfBirth.message as string}</Text>}
          <Text className="text-slate-500 text-xs mt-1">You must be at least 18 years old.</Text>
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
