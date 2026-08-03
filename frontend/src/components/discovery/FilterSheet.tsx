import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
}

export function FilterSheet({ visible, onClose, filters, setFilters }: FilterSheetProps) {
  // Simple filter state for now. In a full implementation, you might use React Hook Form here.
  const applyFilters = () => {
    // Apply filters logic goes here
    onClose();
  };

  const clearFilters = () => {
    setFilters({});
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl h-[70%]">
          <View className="p-4 border-b border-slate-100 flex-row justify-between items-center">
            <TouchableOpacity onPress={onClose} className="p-2" accessibilityLabel="Close filters">
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-slate-900">Filters</Text>
            <TouchableOpacity onPress={clearFilters} className="p-2">
              <Text className="text-blue-500 font-semibold">Clear</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="p-6">
            <Text className="text-lg font-semibold text-slate-800 mb-4">Relationship Goals</Text>
            <View className="flex-row flex-wrap mb-6">
              {['Marriage', 'Serious Relationship', 'Friendship'].map(goal => (
                <TouchableOpacity
                  key={goal}
                  className="bg-slate-100 px-4 py-2 rounded-full mr-2 mb-2"
                >
                  <Text className="text-slate-700">{goal}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-lg font-semibold text-slate-800 mb-4">Age Range</Text>
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-slate-600">18 - 99</Text>
              {/* Add a slider component here later */}
            </View>

            <Text className="text-lg font-semibold text-slate-800 mb-4">Region</Text>
            <View className="bg-slate-100 p-4 rounded-xl mb-6">
              <Text className="text-slate-500">Select Region</Text>
            </View>
          </ScrollView>

          <View className="p-6 border-t border-slate-100 pb-10">
            <TouchableOpacity
              onPress={applyFilters}
              className="bg-[#208AEF] py-4 rounded-2xl items-center"
            >
              <Text className="text-white font-bold text-lg">Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
