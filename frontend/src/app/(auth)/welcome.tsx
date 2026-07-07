import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <StatusBar style="auto" />
      <View className="flex-1 justify-center items-center px-6">
        <View className="flex-1 justify-center items-center">
          <Text className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
            LIB LE LIB
          </Text>
          <Text className="text-lg text-slate-500 dark:text-slate-400 text-center">
            Find your connection.
          </Text>
        </View>

        <View className="w-full pb-8">
          <TouchableOpacity
            onPress={() => router.push('/(auth)/otp')}
            className="w-full bg-blue-600 active:bg-blue-700 py-4 rounded-full flex-row justify-center items-center"
          >
            <Text className="text-white text-lg font-bold">Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
