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
import { parseAndNormalizeDate, is18OrOlder } from '@/lib/zod-schemas';
import { DateOfBirthPicker } from '@/components/common/DateOfBirthPicker';

const schema = z.object({
  dateOfBirth: z.string().refine((val) => {
    return parseAndNormalizeDate(val) !== null;
  }, {
    message: 'Please enter a valid date of birth (e.g. 1998-05-15 or 1998).',
  }).refine((val) => {
    return is18OrOlder(val);
  }, {
    message: 'You must be at least 18 years old to use this app.',
  }),
});

function calculateAge(inputVal: string): { age: number | null; isEligible: boolean } {
  const parsed = parseAndNormalizeDate(inputVal);
  if (!parsed || !parsed.normalized) return { age: null, isEligible: false };
  const birth = new Date(parsed.normalized);
  if (isNaN(birth.getTime())) return { age: null, isEligible: false };

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return { age, isEligible: age >= 18 };
}

export default function Step2DobScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { draft, updateDraft } = useDraftProfileStore();

  const { control, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      dateOfBirth: draft.dateOfBirth || '',
    },
  });

  const rawDob = watch('dateOfBirth');
  const { age, isEligible } = calculateAge(rawDob);

  const onSubmit = (data: { dateOfBirth: string }) => {
    const parsed = parseAndNormalizeDate(data.dateOfBirth);
    updateDraft({ dateOfBirth: parsed ? parsed.normalized : data.dateOfBirth });
    router.push('/(onboarding)/step-3-gender');
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
        {/* Header Icon */}
        <View className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 items-center justify-center mb-6">
          <Ionicons name="calendar-outline" size={32} color="#1B4D5C" />
        </View>

        <Text className="text-3xl font-bold text-slate-900 mb-2">When were you born?</Text>
        <Text className="text-slate-500 mb-8">This helps us find appropriate matches for you.</Text>

        <View className="mb-6">
          <Text className="text-slate-700 font-semibold mb-2">Date of Birth</Text>
          <Controller
            control={control}
            name="dateOfBirth"
            render={({ field: { onChange, value } }) => (
              <DateOfBirthPicker value={value} onChange={onChange} />
            )}
          />
          {errors.dateOfBirth && <Text className="text-red-500 mt-2 font-medium">{errors.dateOfBirth.message as string}</Text>}

          {/* Live Age Indicator Badge */}
          {age !== null && (
            <View className={`mt-3 p-3 rounded-xl flex-row items-center ${isEligible ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
              <Ionicons name={isEligible ? "checkmark-circle" : "alert-circle"} size={20} color={isEligible ? "#059669" : "#D97706"} style={{ marginRight: 8 }} />
              <Text className={`font-semibold ${isEligible ? 'text-emerald-800' : 'text-amber-800'}`}>
                🎂 Calculated Age: {age} years old {isEligible ? '(Eligible)' : '(Must be 18+)'}
              </Text>
            </View>
          )}

          <Text className="text-slate-400 text-xs mt-3">
            💡 You must be at least 18 years old. Your date of birth is kept private.
          </Text>
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
