import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

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
    gender: 'All',
    relationshipGoals: [] as string[],
    ...filters,
  });

  const applyFilters = () => {
    setFilters(localFilters);
    onClose();
  };

  const clearFilters = () => {
    const defaultFilters = { minAge: 18, maxAge: 55, gender: 'All', relationshipGoals: [] };
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl h-[85%]">
          <View className="p-4 border-b border-slate-100 flex-row justify-between items-center">
            <TouchableOpacity onPress={onClose} className="p-2" accessibilityLabel="Close filters">
              <Ionicons name="close" size={24} color="#4A7A8A" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-slate-900">Filters</Text>
            <TouchableOpacity onPress={clearFilters} className="p-2">
              <Text className="text-blue-500 font-semibold">Clear</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="p-6">
            <Text className="text-lg font-semibold text-slate-800 mb-4">Age Range</Text>
            <View className="mb-6">
              <View className="flex-row justify-between mb-2">
                <Text className="text-slate-600">Min Age: {localFilters.minAge}</Text>
                <Text className="text-slate-600">Max Age: {localFilters.maxAge}</Text>
              </View>
              <Text className="text-xs text-slate-400 mb-2">Adjust Max Age (Min 18):</Text>
              <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={18}
                maximumValue={99}
                step={1}
                value={localFilters.maxAge}
                onValueChange={(val) => setLocalFilters({ ...localFilters, maxAge: val })}
                minimumTrackTintColor="#1B4D5C"
                maximumTrackTintColor="#D6DFE2"
              />
            </View>

            <Text className="text-lg font-semibold text-slate-800 mb-4">Gender</Text>
            <View className="flex-row mb-6 bg-slate-100 rounded-xl p-1">
              {['Man', 'Woman', 'All'].map(gender => (
                <TouchableOpacity
                  key={gender}
                  onPress={() => setLocalFilters({ ...localFilters, gender })}
                  className={`flex-1 py-2 rounded-lg items-center justify-center ${localFilters.gender === gender ? 'bg-white shadow-sm' : ''}`}
                >
                  <Text className={localFilters.gender === gender ? 'font-semibold text-slate-900' : 'text-slate-500'}>{gender}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-lg font-semibold text-slate-800 mb-4">Relationship Goals</Text>
            <View className="flex-row flex-wrap mb-6">
              {['Marriage', 'Serious Relationship', 'Friendship'].map(goal => (
                <TouchableOpacity
                  key={goal}
                  onPress={() => toggleGoal(goal)}
                  className={`px-4 py-2 rounded-full mr-2 mb-2 border ${localFilters.relationshipGoals.includes(goal) ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}
                >
                  <Text className={localFilters.relationshipGoals.includes(goal) ? 'text-blue-700 font-medium' : 'text-slate-600'}>{goal}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-lg font-semibold text-slate-800 mb-4">Region</Text>
            <TouchableOpacity className="bg-slate-100 p-4 rounded-xl mb-12 flex-row justify-between items-center">
              <Text className="text-slate-700">All Regions</Text>
              <Ionicons name="chevron-forward" size={20} color="#4A7A8A" />
            </TouchableOpacity>
          </ScrollView>

          <View className="p-6 border-t border-slate-100 pb-10">
            <TouchableOpacity
              onPress={applyFilters}
              className="bg-[#1B4D5C] py-4 rounded-2xl items-center"
            >
              <Text className="text-white font-bold text-lg">Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
