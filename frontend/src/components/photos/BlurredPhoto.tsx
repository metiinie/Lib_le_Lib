import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { usePreferencesStore } from '@/stores/preferences.store';

export interface BlurredPhotoProps {
  blurhash: string;
  photoUrl?: string; // Optional full URL, only fetched if revealGranted is true
  revealGranted: boolean;
  onRevealRequest?: () => void;
  width?: number | string;
  height?: number | string;
}

export const BlurredPhoto = ({
  blurhash,
  photoUrl,
  revealGranted,
  onRevealRequest,
  width = '100%',
  height = '100%',
}: BlurredPhotoProps) => {
  const [currentUrl, setCurrentUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const blurOpacity = useSharedValue(1);
  
  const isLowBandwidthMode = usePreferencesStore(state => state.isLowBandwidthMode);

  useEffect(() => {
    if (revealGranted && photoUrl && !isLowBandwidthMode) {
      setLoading(true);
      setCurrentUrl(photoUrl);
      // Crossfade from blurhash to full image
      blurOpacity.value = withTiming(0, {
        duration: 500,
        easing: Easing.inOut(Easing.ease),
      });
    } else {
      setCurrentUrl(undefined);
      blurOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [revealGranted, photoUrl, isLowBandwidthMode]);

  const animatedBlurStyle = useAnimatedStyle(() => ({
    opacity: blurOpacity.value,
  }));

  return (
    <View style={[{ width: width as any, height: height as any }, styles.container]}>
      {/* Base Layer: Full Image (Only rendered if reveal is granted and URL exists) */}
      {revealGranted && currentUrl && (
        <Image
          source={{ uri: currentUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      )}

      {/* Top Layer: Blurhash Placeholder (Fades out when revealed) */}
      <Animated.View style={[StyleSheet.absoluteFill, animatedBlurStyle]}>
        <Image
          source={{ blurhash: blurhash || 'LEHV6nWB2yk8pyo0adR*.7kCMdnj' }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
        
        {/* Overlay for reveal request prompt if applicable */}
        {!revealGranted && onRevealRequest && (
          <TouchableOpacity 
            style={styles.revealOverlay}
            onPress={onRevealRequest}
            activeOpacity={0.8}
          >
            <View style={styles.revealButton}>
              <Text style={styles.revealText}>Tap to request reveal</Text>
            </View>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#cbd5e1', // slate-300 fallback
    borderRadius: 8,
  },
  revealOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  revealButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  revealText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
