import { Stack } from 'expo-router';

/**
 * Auth group layout.
 *
 * Screen registration order = nav stack order.
 * All screens use headerShown: false — each screen renders its own back button
 * so we have full control over the UI and can match the app's design system.
 *
 * Navigation flow:
 *   welcome → login → login-phone → (tabs)
 *                  ↘ forgot-password
 *   welcome → register-phone → verify-otp → set-password → (onboarding)
 *
 * The old `otp` screen is kept registered so any deep links or bookmarks
 * don't crash. It is unreachable from normal navigation.
 */
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
      <Stack.Screen name="login" />
      <Stack.Screen name="login-phone" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="register-phone" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="set-password" />
      {/* Legacy screen — kept to prevent deep-link crashes, unreachable normally */}
      <Stack.Screen name="otp" />
    </Stack>
  );
}
