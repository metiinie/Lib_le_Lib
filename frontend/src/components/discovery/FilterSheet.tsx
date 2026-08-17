import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { profileService } from '@/services/profile.service';

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
}

export function FilterSheet({ visible, onClose, filters, setFilters }: FilterSheetProps) {
  const [localFilters, setLocalFilters] = useState({
    minAge: 18,
    maxAge: 55,
    gender: 'all',
    regionId: '',
    relationshipGoals: [] as string[],
    ...filters,
  });

  const [regions, setRegions] = useState<{ id: string; name: string; countryCode?: string }[]>([]);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [isRegionSelectorOpen, setIsRegionSelectorOpen] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchRegions();
    }
  }, [visible]);

  const fetchRegions = async () => {
    setLoadingRegions(true);
    try {
      const data = await profileService.getRegions();
      setRegions(data);
    } catch (err) {
      console.warn('Failed to fetch regions, using fallback list', err);
      // Comprehensive fallback list for Ethiopia and Eritrea
      const fallback = [
        { id: '1', name: 'Addis Ababa (Capital)', countryCode: 'ET' },
        { id: '2', name: 'Oromia (Adama, Jimma, Bishoftu)', countryCode: 'ET' },
        { id: '3', name: 'Amhara (Bahir Dar, Gondar, Dessie)', countryCode: 'ET' },
        { id: '4', name: 'Tigray (Mekelle, Adigrat)', countryCode: 'ET' },
        { id: '5', name: 'Sidama (Hawassa)', countryCode: 'ET' },
        { id: '6', name: 'Somali (Jijiga, Gode)', countryCode: 'ET' },
        { id: '7', name: 'Dire Dawa', countryCode: 'ET' },
        { id: '8', name: 'Afar (Semera, Asaita)', countryCode: 'ET' },
        { id: '9', name: 'Benishangul-Gumuz (Asosa)', countryCode: 'ET' },
        { id: '10', name: 'Gambela (Gambela City)', countryCode: 'ET' },
        { id: '11', name: 'Harari (Harar)', countryCode: 'ET' },
        { id: '12', name: 'SNNPR (Arba Minch, Wolaita Sodo)', countryCode: 'ET' },
        { id: '13', name: 'SWEPR (Bonga, Mizan Teferi)', countryCode: 'ET' },
        { id: '14', name: 'Maekel / Central (Asmara)', countryCode: 'ER' },
        { id: '15', name: 'Anseba (Keren)', countryCode: 'ER' },
        { id: '16', name: 'Gash-Barka (Barentu, Tessenei)', countryCode: 'ER' },
        { id: '17', name: 'Debub / Southern (Mendefera, Dekemhare)', countryCode: 'ER' },
        { id: '18', name: 'Northern Red Sea (Massawa)', countryCode: 'ER' },
        { id: '19', name: 'Southern Red Sea (Assab)', countryCode: 'ER' },
      ];
      setRegions(fallback);
    } finally {
      setLoadingRegions(false);
    }
  };

  if (!visible) return null;

  const applyFilters = () => {
    setFilters(localFilters);
    onClose();
  };

  const clearFilters = () => {
    const defaultFilters = { minAge: 18, maxAge: 55, gender: 'all', regionId: '', relationshipGoals: [] };
    setLocalFilters(defaultFilters);
    setFilters(defaultFilters);
    onClose();
  };

  const toggleGoal = (goal: string) => {
    setLocalFilters((prev: any) => {
      const goals = prev.relationshipGoals.includes(goal)
        ? prev.relationshipGoals.filter((g: string) => g !== goal)
        : [...prev.relationshipGoals, goal];
      return { ...prev, relationshipGoals: goals };
    });
  };

  const genderOptions = [
    { label: 'All', value: 'all' },
    { label: 'Men', value: 'man' },
    { label: 'Women', value: 'woman' },
  ];

  const selectedRegionName =
    regions.find((r) => r.id === localFilters.regionId)?.name || 'All Regions';

  return (
    <View style={StyleSheet.absoluteFillObject} className="z-50 justify-end">
      {/* Backdrop overlay */}
      <TouchableOpacity
        style={StyleSheet.absoluteFillObject}
        className="bg-black/40"
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Sheet Content Container */}
      <View className="bg-white rounded-t-3xl max-h-[85%] border-t border-slate-200 shadow-2xl z-10">
        {/* Header */}
        <View className="p-4 border-b border-slate-100 flex-row justify-between items-center bg-[#F5F7F8] rounded-t-3xl">
          <TouchableOpacity onPress={onClose} className="p-2" accessibilityLabel="Close filters">
            <Ionicons name="close" size={24} color="#4A7A8A" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-[#0F1E24]">Filters</Text>
          <TouchableOpacity onPress={clearFilters} className="p-2">
            <Text className="text-[#1B4D5C] font-bold text-sm">Clear</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
          {/* Age Range Filter */}
          <Text className="text-lg font-bold text-[#0F1E24] mb-3">Age Range</Text>
          <View className="mb-6 bg-[#F5F7F8] p-4 rounded-2xl border border-slate-200">
            <View className="flex-row justify-between mb-2">
              <Text className="text-[#4A7A8A] font-semibold text-sm">Min Age: {localFilters.minAge}</Text>
              <Text className="text-[#1B4D5C] font-bold text-sm">Max Age: {localFilters.maxAge}</Text>
            </View>
            <Text className="text-xs color-[#6B9BAA] mb-2 font-medium">Adjust maximum age preference:</Text>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={18}
              maximumValue={99}
              step={1}
              value={localFilters.maxAge}
              onValueChange={(val) => setLocalFilters({ ...localFilters, maxAge: val })}
              minimumTrackTintColor="#1B4D5C"
              maximumTrackTintColor="#D6DFE2"
              thumbTintColor="#1B4D5C"
            />
          </View>

          {/* Gender Filter */}
          <Text className="text-lg font-bold text-[#0F1E24] mb-3">Show Me</Text>
          <View className="flex-row mb-6 bg-[#F5F7F8] rounded-2xl p-1.5 border border-slate-200">
            {genderOptions.map((opt) => {
              const isSelected = localFilters.gender === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setLocalFilters({ ...localFilters, gender: opt.value })}
                  className="flex-1 py-3 rounded-xl items-center justify-center"
                  style={isSelected ? styles.selectedGenderBtn : styles.unselectedGenderBtn}
                >
                  <Text style={isSelected ? styles.selectedGenderText : styles.unselectedGenderText}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Relationship Goals */}
          <Text className="text-lg font-bold text-[#0F1E24] mb-3">Relationship Goals</Text>
          <View className="flex-row flex-wrap mb-6">
            {['Marriage', 'Serious Relationship', 'Friendship'].map((goal) => {
              const isSelected = localFilters.relationshipGoals.includes(goal);
              return (
                <TouchableOpacity
                  key={goal}
                  onPress={() => toggleGoal(goal)}
                  className="px-4 py-2.5 rounded-full mr-2 mb-2 border"
                  style={isSelected ? styles.selectedGoalChip : styles.unselectedGoalChip}
                >
                  <Text style={isSelected ? styles.selectedGoalText : styles.unselectedGoalText}>
                    {goal}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Region Filter */}
          <Text className="text-lg font-bold text-[#0F1E24] mb-3">Region & Cities</Text>
          <TouchableOpacity
            onPress={() => setIsRegionSelectorOpen(!isRegionSelectorOpen)}
            className="bg-[#F5F7F8] border border-slate-200 p-4 rounded-2xl mb-4 flex-row justify-between items-center"
          >
            <View className="flex-row items-center flex-1 mr-2">
              <Ionicons name="location-outline" size={20} color="#1B4D5C" style={{ marginRight: 8 }} />
              <Text className="text-[#0F1E24] font-semibold text-base" numberOfLines={1}>
                {selectedRegionName}
              </Text>
            </View>
            <Ionicons
              name={isRegionSelectorOpen ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#4A7A8A"
            />
          </TouchableOpacity>

          {/* Expanded Region List */}
          {isRegionSelectorOpen && (
            <View className="bg-[#F5F7F8] border border-slate-200 rounded-2xl p-2 mb-8 max-h-60">
              <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true}>
                <TouchableOpacity
                  onPress={() => {
                    setLocalFilters({ ...localFilters, regionId: '' });
                    setIsRegionSelectorOpen(false);
                  }}
                  className={`p-3 rounded-xl mb-1 flex-row items-center justify-between ${!localFilters.regionId ? 'bg-white border border-[#D6DFE2]' : ''
                    }`}
                >
                  <Text className={!localFilters.regionId ? 'font-bold text-[#1B4D5C]' : 'text-[#4A7A8A]'}>
                    All Regions
                  </Text>
                  {!localFilters.regionId && <Ionicons name="checkmark" size={18} color="#1B4D5C" />}
                </TouchableOpacity>

                {loadingRegions ? (
                  <View className="py-4 items-center">
                    <ActivityIndicator size="small" color="#1B4D5C" />
                  </View>
                ) : (
                  regions.map((reg) => {
                    const isSelected = localFilters.regionId === reg.id;
                    const flag = reg.countryCode === 'ER' ? '🇪🇷' : '🇪🇹';
                    return (
                      <TouchableOpacity
                        key={reg.id}
                        onPress={() => {
                          setLocalFilters({ ...localFilters, regionId: reg.id });
                          setIsRegionSelectorOpen(false);
                        }}
                        className={`p-3 rounded-xl mb-1 flex-row items-center justify-between ${isSelected ? 'bg-white border border-[#D6DFE2]' : ''
                          }`}
                      >
                        <Text className={`flex-1 text-sm ${isSelected ? 'font-bold text-[#1B4D5C]' : 'text-[#0F1E24]'}`}>
                          {flag} {reg.name}
                        </Text>
                        {isSelected && <Ionicons name="checkmark" size={18} color="#1B4D5C" />}
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            </View>
          )}
        </ScrollView>

        {/* Apply CTA */}
        <View className="p-6 border-t border-slate-100 pb-10 bg-white">
          <TouchableOpacity
            onPress={applyFilters}
            className="bg-[#1B4D5C] py-4 rounded-full items-center shadow-md"
            activeOpacity={0.85}
          >
            <Text className="text-white font-bold text-lg">Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  selectedGenderBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D6DFE2',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  unselectedGenderBtn: {
    backgroundColor: 'transparent',
  },
  selectedGenderText: {
    fontWeight: '700',
    color: '#1B4D5C',
  },
  unselectedGenderText: {
    fontWeight: '600',
    color: '#4A7A8A',
  },
  selectedGoalChip: {
    backgroundColor: '#EBF3F5',
    borderColor: '#1B4D5C',
  },
  unselectedGoalChip: {
    backgroundColor: '#F5F7F8',
    borderColor: '#E2E8F0',
  },
  selectedGoalText: {
    fontWeight: '700',
    color: '#1B4D5C',
  },
  unselectedGoalText: {
    fontWeight: '500',
    color: '#4A7A8A',
  },
});
