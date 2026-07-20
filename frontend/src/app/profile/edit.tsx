import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { accountService } from '@/services/account.service';

export default function ProfileEditScreen() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock pre-filled state
  const [nickname, setNickname] = useState('Alex');
  const [dob, setDob] = useState('1990-01-01');
  const [gender, setGender] = useState('male');
  const [region, setRegion] = useState('Addis Ababa');
  const [goals, setGoals] = useState('long_term');

  // Mock photo management
  const [photos, setPhotos] = useState([
    { id: '1', uri: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80', isPrimary: true },
    { id: '2', uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', isPrimary: false }
  ]);
  
  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await accountService.updateProfile({ nickname, region }); // Extend backend in real app
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const setPrimaryPhoto = (id: string) => {
    setPhotos(photos.map(p => ({ ...p, isPrimary: p.id === id })));
  };

  const removePhoto = (id: string) => {
    setPhotos(photos.filter(p => p.id !== id));
  };

  return (
    <ScrollView className="flex-1 bg-white px-6 pt-16">
      <View className="flex-row items-center justify-between mb-8">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="chevron-back" size={28} color="#0f172a" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-slate-900">Edit Profile</Text>
        <View className="w-10" />
      </View>

      <Text className="text-slate-700 font-semibold mb-2 mt-4">Nickname</Text>
      <TextInput
        className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 mb-6"
        value={nickname}
        onChangeText={setNickname}
      />

      <Text className="text-slate-700 font-semibold mb-2">Date of Birth</Text>
      <TextInput
        className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 mb-6 opacity-50"
        value={dob}
        editable={false} // Prevent easy changes to prevent underage bypassing
      />

      <Text className="text-slate-700 font-semibold mb-2">Gender</Text>
      <View className="bg-slate-50 border border-slate-200 rounded-xl mb-6 overflow-hidden">
        <Picker selectedValue={gender} onValueChange={setGender}>
          <Picker.Item label="Male" value="male" />
          <Picker.Item label="Female" value="female" />
          <Picker.Item label="Non-binary" value="non_binary" />
        </Picker>
      </View>

      <Text className="text-slate-700 font-semibold mb-2">Region</Text>
      <View className="bg-slate-50 border border-slate-200 rounded-xl mb-6 overflow-hidden">
        <Picker selectedValue={region} onValueChange={setRegion}>
          <Picker.Item label="Addis Ababa" value="Addis Ababa" />
          <Picker.Item label="Dire Dawa" value="Dire Dawa" />
          <Picker.Item label="Oromia" value="Oromia" />
          <Picker.Item label="Amhara" value="Amhara" />
        </Picker>
      </View>

      <Text className="text-slate-700 font-semibold mb-2">Relationship Goals</Text>
      <View className="bg-slate-50 border border-slate-200 rounded-xl mb-8 overflow-hidden">
        <Picker selectedValue={goals} onValueChange={setGoals}>
          <Picker.Item label="Long-term relationship" value="long_term" />
          <Picker.Item label="Friendship" value="friendship" />
          <Picker.Item label="Casual dating" value="casual" />
        </Picker>
      </View>

      <View className="mb-8">
        <Text className="text-slate-700 font-semibold mb-4">Manage Photos</Text>
        
        <View className="flex-row flex-wrap justify-between">
          {photos.map((photo, index) => (
            <View key={photo.id} className="w-[48%] mb-4 relative">
              <Image 
                source={{ uri: photo.uri }} 
                style={{ width: '100%', aspectRatio: 3/4, borderRadius: 12, borderWidth: photo.isPrimary ? 4 : 1, borderColor: photo.isPrimary ? '#4f46e5' : '#e2e8f0' }} 
              />
              
              <View className="absolute top-2 left-2 flex-row">
                {photo.isPrimary && (
                  <View className="bg-indigo-600 px-2 py-1 rounded-md">
                    <Text className="text-white text-xs font-bold">Primary</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity 
                className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full items-center justify-center"
                onPress={() => removePhoto(photo.id)}
              >
                <Ionicons name="close" size={18} color="#fff" />
              </TouchableOpacity>

              {!photo.isPrimary && (
                <TouchableOpacity 
                  className="mt-2 bg-slate-100 py-2 rounded-lg items-center border border-slate-200"
                  onPress={() => setPrimaryPhoto(photo.id)}
                >
                  <Text className="text-slate-700 font-semibold text-xs">Set as Primary</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity className="w-[48%] aspect-[3/4] bg-slate-100 border border-slate-200 border-dashed rounded-xl items-center justify-center">
            <Ionicons name="add-circle-outline" size={32} color="#64748b" />
            <Text className="text-slate-600 font-medium mt-2">Add Photo</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity 
        className="w-full bg-blue-600 py-4 rounded-xl items-center mb-12 shadow-sm"
        onPress={handleSave}
        disabled={isSubmitting}
      >
        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">Save Changes</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}
