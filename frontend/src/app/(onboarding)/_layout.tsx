import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="profile-create" />
      <Stack.Screen name="doc-upload" />
      <Stack.Screen name="liveness" />
      <Stack.Screen name="pending" />
      <Stack.Screen name="rejected" />
    </Stack>
  );
}
