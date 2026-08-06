import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema, ProfileDto, parseAndNormalizeDate } from '@/lib/zod-schemas';
import { profileService } from '@/services/profile.service';
import { Picker } from '@react-native-picker/picker';

const RELATIONS_OPTIONS = [
  { label: 'Marriage', value: 'marriage' },
  { label: 'Serious Relationship', value: 'serious_relationship' },
  { label: 'Friendship', value: 'friendship' },
] as const;

const FALLBACK_REGIONS = [
  { id: 'addis-ababa', name: 'Addis Ababa' },
  { id: 'oromia', name: 'Oromia' },
  { id: 'amhara', name: 'Amhara' },
  { id: 'tigray', name: 'Tigray' },
  { id: 'sidama', name: 'Sidama' },
  { id: 'somali', name: 'Somali' },
  { id: 'dire-dawa', name: 'Dire Dawa' },
];

export default function ProfileCreateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regions, setRegions] = useState<{ id: string; name: string }[]>(FALLBACK_REGIONS);
  const [isLoadingRegions, setIsLoadingRegions] = useState(true);

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProfileDto>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nickname: '',
      dateOfBirth: '',
      gender: 'man',
      relationshipGoals: [],
      bio: '',
    },
  });

  useEffect(() => {
    let mounted = true;
    async function fetchRegions() {
      try {
        const data = await profileService.getRegions();
        if (mounted && Array.isArray(data) && data.length > 0) {
          // Deduplicate by name for clean picker items
          const uniqueMap = new Map<string, { id: string; name: string }>();
          data.forEach(item => {
            if (!uniqueMap.has(item.name)) {
              uniqueMap.set(item.name, item);
            }
          });
          const uniqueList = Array.from(uniqueMap.values());
          setRegions(uniqueList);
          setValue('regionId', uniqueList[0].id);
        } else if (mounted) {
          setValue('regionId', FALLBACK_REGIONS[0].id);
        }
      } catch (err) {
        console.warn('Failed to load regions from API, using defaults:', err);
        if (mounted) {
          setRegions(FALLBACK_REGIONS);
          setValue('regionId', FALLBACK_REGIONS[0].id);
        }
      } finally {
        if (mounted) setIsLoadingRegions(false);
      }
    }
    fetchRegions();
    return () => { mounted = false; };
  }, [setValue]);

  const selectedGoals = watch('relationshipGoals') || [];

  const toggleGoal = (goalValue: 'marriage' | 'serious_relationship' | 'friendship') => {
    const current = [...selectedGoals];
    const index = current.indexOf(goalValue);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(goalValue);
    }
    setValue('relationshipGoals', current, { shouldValidate: true });
  };

  const onSubmit = async (data: ProfileDto) => {
    setIsSubmitting(true);
    try {
      const parsedDate = parseAndNormalizeDate(data.dateOfBirth);
      const normalizedData = {
        ...data,
        dateOfBirth: parsedDate ? parsedDate.normalized : data.dateOfBirth,
      };

      try {
        await profileService.createProfile(normalizedData);
      } catch (err: any) {
        const errCode = err?.response?.data?.error?.code;
        const errStatus = err?.response?.status;
        if (errStatus === 409 || errCode === 'PROFILE_EXISTS') {
          await profileService.updateProfile(normalizedData);
        } else {
          throw err;
        }
      }

      router.push('/(onboarding)/photo-upload');
    } catch (error: any) {
      const msg = error?.response?.data?.error?.message || error?.message || 'Failed to create profile';
      Alert.alert('Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <KeyboardAwareScrollView 
        className="flex-1 bg-white px-6 pt-16"
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={20}
      >
        <Text className="text-3xl font-bold text-slate-900 mb-8">Create your profile</Text>

      {/* Nickname */}
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
            />
          )}
        />
        {errors.nickname && <Text className="text-red-500 mt-1">{errors.nickname.message}</Text>}
      </View>

      {/* DOB */}
      <View className="mb-6">
        <Text className="text-slate-700 font-semibold mb-2">Date of Birth</Text>
        <Controller
          control={control}
          name="dateOfBirth"
          render={({ field: { onChange, value } }) => (
            <TextInput
              className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900"
              placeholder="YYYY-MM-DD"
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        {errors.dateOfBirth && <Text className="text-red-500 mt-1">{errors.dateOfBirth.message}</Text>}
        <Text className="text-slate-500 text-xs mt-1">You must be at least 18 years old.</Text>
      </View>

      {/* Gender */}
      <View className="mb-6">
        <Text className="text-slate-700 font-semibold mb-2">Gender</Text>
        <Controller
          control={control}
          name="gender"
          render={({ field: { onChange, value } }) => (
            <View className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
              <Picker selectedValue={value} onValueChange={onChange}>
                <Picker.Item label="Man" value="man" />
                <Picker.Item label="Woman" value="woman" />
                <Picker.Item label="Other" value="other" />
              </Picker>
            </View>
          )}
        />
        {errors.gender && <Text className="text-red-500 mt-1">{errors.gender.message}</Text>}
      </View>

      {/* Region */}
      <View className="mb-6">
        <Text className="text-slate-700 font-semibold mb-2">Region</Text>
        <Controller
          control={control}
          name="regionId"
          render={({ field: { onChange, value } }) => (
            <View className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
              {isLoadingRegions ? (
                <View className="p-4 items-center">
                  <ActivityIndicator size="small" color="#1B4D5C" />
                </View>
              ) : (
                <Picker selectedValue={value} onValueChange={onChange}>
                  {regions.length > 0 ? (
                    regions.map((reg) => (
                      <Picker.Item key={reg.id} label={reg.name} value={reg.id} />
                    ))
                  ) : (
                    <Picker.Item label="Select Region" value="" />
                  )}
                </Picker>
              )}
            </View>
          )}
        />
        {errors.regionId && <Text className="text-red-500 mt-1">{errors.regionId.message}</Text>}
      </View>

      {/* Relationship Goals */}
      <View className="mb-6">
        <Text className="text-slate-700 font-semibold mb-2">Relationship Goals</Text>
        <View className="flex-row flex-wrap gap-2">
          {RELATIONS_OPTIONS.map((item) => {
            const isSelected = selectedGoals.includes(item.value);
            return (
              <TouchableOpacity
                key={item.value}
                onPress={() => toggleGoal(item.value)}
                className={`px-4 py-3 rounded-xl border ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <Text
                  className={`font-semibold ${
                    isSelected ? 'text-white' : 'text-slate-700'
                  }`}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {errors.relationshipGoals && (
          <Text className="text-red-500 mt-1">{errors.relationshipGoals.message}</Text>
        )}
      </View>

      {/* Bio */}
      <View className="mb-6">
        <Text className="text-slate-700 font-semibold mb-2">Bio</Text>
        <Controller
          control={control}
          name="bio"
          render={({ field: { onChange, value } }) => (
            <TextInput
              className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 h-24"
              placeholder="Tell us a bit about yourself"
              multiline
              textAlignVertical="top"
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        {errors.bio && <Text className="text-red-500 mt-1">{errors.bio.message}</Text>}
      </View>

      </KeyboardAwareScrollView>

      {/* Sticky Bottom Button */}
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
          className={`bg-blue-600 p-4 rounded-xl items-center ${isSubmitting ? 'opacity-50' : ''}`}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          <Text className="text-white font-bold text-lg">{isSubmitting ? 'Saving...' : 'Continue'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
