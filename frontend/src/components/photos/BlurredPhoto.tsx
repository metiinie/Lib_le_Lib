import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Image } from 'expo-image';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

interface BlurredPhotoProps {
  blurhash: string;
  photoUrl?: string; // Optional full URL, only fetched if revealGranted is true
  revealGranted: boolean;
  onRevealRequest?: () => void;
  width?: number | string;
  height?: number | string;
  className?: string; // Tapping into our NativeWind augmented types
}

export const BlurredPhoto = ({
  blurhash,
  photoUrl,
  revealGranted,
  onRevealRequest,
  width = '100%',
  height = '100%',
  className,
}: BlurredPhotoProps) => {
  const [currentUrl, setCurrentUrl] = useState<string | undefined>(undefined);
  const blurOpacity = useSharedValue(1);

  useEffect(() => {
    if (revealGranted && photoUrl) {
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
  }, [revealGranted, photoUrl]);

  const animatedBlurStyle = useAnimatedStyle(() => ({
    opacity: blurOpacity.value,
  }));

  return (
    <View style={[{ width: width as any, height: height as any }, styles.container]} className={className}>
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
          source={blurhash} // expo-image natively supports blurhashes via the source prop
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
        
        {/* Overlay for reveal request prompt if applicable */}
        {!revealGranted && onRevealRequest && (
          <TouchableOpacity 
            className="absolute inset-0 items-center justify-center bg-black/30"
            onPress={onRevealRequest}
            activeOpacity={0.8}
          >
            <View className="bg-white/20 px-4 py-2 rounded-full backdrop-blur-md border border-white/30">
              <Text className="text-white font-semibold">Tap to request reveal</Text>
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
});
