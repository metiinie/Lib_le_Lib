import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '@react-navigation/native';
import type { Theme } from '@react-navigation/native';
import { Stack, router, useSegments, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

const LibLeLibDark: Theme = {
  dark: true,
  colors: {
    primary: '#C4623A',      // Warm Terracotta — accent
    background: '#0F1E24',   // Deep Ocean
    card: '#162A33',         // Night Teal
    text: '#EFF4F5',         // Warm White
    border: '#1B3D48',
    notification: '#D4784F', // Terracotta Light
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    bold: { fontFamily: 'System', fontWeight: '700' },
    heavy: { fontFamily: 'System', fontWeight: '900' },
  },
};

const LibLeLibLight: Theme = {
  dark: false,
  colors: {
    primary: '#1B4D5C',      // Trusted Teal — primary brand
    background: '#F5F7F8',   // Warm Off-white
    card: '#FFFFFF',
    text: '#0F1E24',         // Deep Ocean
    border: '#D6DFE2',
    notification: '#C4623A', // Warm Terracotta
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    bold: { fontFamily: 'System', fontWeight: '700' },
    heavy: { fontFamily: 'System', fontWeight: '900' },
  },
};
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/state/auth.store';
import { userService } from '@/services/user.service';
import { profileService } from '@/services/profile.service';
import { verificationService } from '@/services/verification.service';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import '../global.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated } = useAuth();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  // Keep splash screen visible until auth store has finished hydrating
  // from SecureStore. Without this gate, `token` reads as null during
  // hydration, triggering a premature redirect to auth, API 401s, and
  // a redirect loop that freezes the app on slower devices.
  useEffect(() => {
    if (hasHydrated) {
      SplashScreen.hideAsync();
    }
  }, [hasHydrated]);

  useEffect(() => {
    // Don't navigate until both hydration and the navigation tree are ready
    if (!hasHydrated) return;
    if (!navigationState?.key) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      setTimeout(() => {
        router.replace('/(auth)/welcome');
      }, 0);
    } else if (isAuthenticated && (inAuthGroup || segments.length === 0)) {
      let isCancelled = false;

      const resolveRoute = async () => {
        try {
          // 1. Fetch user identity, role, and status
          const user = await userService.getMe();
          if (isCancelled) return;

          const isStaffRole = [
            'verification_officer',
            'moderator',
            'health_professional',
            'admin',
          ].includes(user.role);

          // Active members and staff roles skip onboarding
          if (isStaffRole || user.status === 'active') {
            router.replace('/(tabs)/discover');
            return;
          }

          // 2. Pending member flow: check profile
          let hasProfile = false;
          try {
            await profileService.getProfile();
            hasProfile = true;
          } catch (err: any) {
            if (err?.response?.status === 404) {
              router.replace('/(onboarding)/step-1-nickname');
              return;
            }
          }

          if (!hasProfile) {
            router.replace('/(onboarding)/step-1-nickname');
            return;
          }

          // 3. Check verification submission status
          const { status } = await verificationService.checkStatus();
          if (isCancelled) return;

          if (status === 'approved') {
            router.replace('/(tabs)/discover');
          } else if (status === 'submitted' || status === 'in_review') {
            router.replace('/(onboarding)/pending');
          } else if (status === 'rejected') {
            router.replace('/(onboarding)/rejected');
          } else {
            router.replace('/(onboarding)/doc-upload');
          }
        } catch (err: any) {
          if (isCancelled) return;
          console.warn('Route resolution error:', err?.message);
          const errStatus = err?.response?.status;
          if (errStatus === 401 || errStatus === 403) {
            // Invalid or expired token — clear auth state
            // The outer useEffect will react to isAuthenticated changing to false and handle the redirect safely.
            useAuthStore.getState().signOut();
          }
        }
      };

      resolveRoute();
      return () => {
        isCancelled = true;
      };
    }
  }, [isAuthenticated, segments, navigationState?.key, hasHydrated]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={colorScheme === 'dark' ? LibLeLibDark : LibLeLibLight}>
          <Stack screenOptions={{ headerShown: false }} />
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

