import React from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7F8' }}>
      <ActivityIndicator size="large" color="#1B4D5C" />
    </View>
  );
}
