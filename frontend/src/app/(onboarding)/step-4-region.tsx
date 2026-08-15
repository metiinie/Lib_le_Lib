import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDraftProfileStore } from '@/state/draftProfile.store';
import { profileService } from '@/services/profile.service';
import { Picker } from '@react-native-picker/picker';

export default function Step4RegionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { draft, updateDraft } = useDraftProfileStore();
  
  const [regions, setRegions] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegionId, setSelectedRegionId] = useState<string>(draft.regionId || '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const data = await profileService.getRegions();
        setRegions(data);
        if (!selectedRegionId && data.length > 0) {
          setSelectedRegionId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch regions', err);
        // Fallback
        const fallback = [
          { id: '1', name: 'Addis Ababa (Ethiopia)' },
          { id: '2', name: 'Dire Dawa (Ethiopia)' },
          { id: '3', name: 'Oromia (Ethiopia)' },
          { id: '4', name: 'Amhara (Ethiopia)' },
          { id: '5', name: 'Tigray (Ethiopia)' },
          { id: '6', name: 'Maekel / Central (Eritrea)' },
          { id: '7', name: 'Anseba (Eritrea)' },
        ];
        setRegions(fallback);
        if (!selectedRegionId) setSelectedRegionId(fallback[0].id);
      } finally {
        setLoading(false);
      }
    };
    fetchRegions();
  }, []);

  const onSubmit = () => {
    if (!selectedRegionId) {
      setError('Please select a region');
      return;
    }
    setError(null);
    updateDraft({ regionId: selectedRegionId });
    router.push('/(onboarding)/step-5-looking-for');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <KeyboardAwareScrollView 
        className="flex-1 bg-white px-6 pt-16"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-3xl font-bold text-slate-900 mb-2">Where do you live?</Text>
        <Text className="text-slate-500 mb-8">This helps us find matches near you.</Text>

        <View className="mb-6">
          {loading ? (
            <View className="py-8 items-center justify-center">
              <ActivityIndicator size="large" color="#1B4D5C" />
            </View>
          ) : (
            <View className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
              <Picker
                selectedValue={selectedRegionId}
                onValueChange={(itemValue) => setSelectedRegionId(itemValue)}
                style={{ height: 50, width: '100%' }}
              >
                {regions.map((r) => (
                  <Picker.Item key={r.id} label={r.name} value={r.id} color="#0F1E24" />
                ))}
              </Picker>
            </View>
          )}
          {error && <Text className="text-red-500 mt-2">{error}</Text>}
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
          onPress={onSubmit}
          disabled={loading}
        >
          <Text className="text-white font-bold text-lg">Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
