import { useState, useEffect } from 'react';

// Mock network hook for MVP
// In a real app, this would use expo-network or @react-native-community/netinfo
export function useNetwork() {
  const [isOnline, setIsOnline] = useState(true);

  // For testing purposes, we assume online by default. 
  // You can manually toggle this to test offline degradation.
  
  return { isOnline };
}
