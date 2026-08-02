import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router, useSegments, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/state/auth.store';
import { userService } from '@/services/user.service';
import { profileService } from '@/services/profile.service';
import { verificationService } from '@/services/verification.service';
import '../global.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated } = useAuth();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
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
              router.replace('/(onboarding)/profile-create');
              return;
            }
          }

          if (!hasProfile) {
            router.replace('/(onboarding)/profile-create');
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
  }, [isAuthenticated, segments, navigationState?.key]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
