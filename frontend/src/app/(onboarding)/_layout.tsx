import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="step-1-nickname" />
      <Stack.Screen name="step-2-dob" />
      <Stack.Screen name="step-3-gender" />
      <Stack.Screen name="step-4-region" />
      <Stack.Screen name="step-5-looking-for" />
      <Stack.Screen name="step-6-relationship-goals" />
      <Stack.Screen name="step-7-virus-type" />
      <Stack.Screen name="step-8-bio" />
      <Stack.Screen name="step-9-photo" />
      <Stack.Screen name="doc-upload" />
      <Stack.Screen name="liveness" />
      <Stack.Screen name="pending" />
      <Stack.Screen name="rejected" />
    </Stack>
  );
}
