import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema, ProfileDto } from '@/lib/zod-schemas';
import { profileService } from '@/services/profile.service';
import { Picker } from '@react-native-picker/picker';

export default function ProfileCreateScreen() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<ProfileDto>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      relationshipGoals: [],
      gender: 'man',
      region: 'Addis Ababa',
    },
  });

  const onSubmit = async (data: ProfileDto) => {
    setIsSubmitting(true);
    try {
      await profileService.createProfile(data);
      router.push('/(onboarding)/doc-upload');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white px-6 pt-16">
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
                <Picker.Item label="Non-binary" value="non_binary" />
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
          name="region"
          render={({ field: { onChange, value } }) => (
            <View className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
              <Picker selectedValue={value} onValueChange={onChange}>
                <Picker.Item label="Addis Ababa" value="Addis Ababa" />
                <Picker.Item label="Dire Dawa" value="Dire Dawa" />
                <Picker.Item label="Amhara" value="Amhara" />
                <Picker.Item label="Oromia" value="Oromia" />
                <Picker.Item label="Tigray" value="Tigray" />
              </Picker>
            </View>
          )}
        />
        {errors.region && <Text className="text-red-500 mt-1">{errors.region.message}</Text>}
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

      <TouchableOpacity
        className={`bg-blue-600 p-4 rounded-xl items-center mb-12 ${isSubmitting ? 'opacity-50' : ''}`}
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
      >
        <Text className="text-white font-bold text-lg">{isSubmitting ? 'Saving...' : 'Continue'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
