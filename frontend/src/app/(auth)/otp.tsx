import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/auth.service';

const RESEND_TIMEOUT = 30; // seconds

export default function OtpScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  // Track whether this is a sign-up or sign-in flow.
  // We attempt sign-in first; if the backend returns USER_NOT_FOUND we retry as sign-up.
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [timeLeft]);

  const handleRequestOtp = async (forceSignUp?: boolean) => {
    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      Alert.alert('Error', 'Please enter your phone number or email.');
      return;
    }

    if (timeLeft > 0) {
      return;
    }

    setIsLoading(true);
    let targetSignUp = forceSignUp ?? isSignUp;

    try {
      await authService.requestOtp(cleanIdentifier, targetSignUp);
      setIsSignUp(targetSignUp);
      setStep(2);
      setTimeLeft(RESEND_TIMEOUT);
    } catch (error: any) {
      const rawErr = error?.response?.data;
      const code = rawErr?.error?.code;

      // Auto-fallback if signup/login mode mismatches account existence
      if (code === 'USER_NOT_FOUND' && !targetSignUp) {
        try {
          targetSignUp = true;
          await authService.requestOtp(cleanIdentifier, true);
          setIsSignUp(true);
          setStep(2);
          setTimeLeft(RESEND_TIMEOUT);
          return;
        } catch (retryErr: any) {
          error = retryErr;
        }
      } else if (code === 'USER_ALREADY_EXISTS' && targetSignUp) {
        try {
          targetSignUp = false;
          await authService.requestOtp(cleanIdentifier, false);
          setIsSignUp(false);
          setStep(2);
          setTimeLeft(RESEND_TIMEOUT);
          return;
        } catch (retryErr: any) {
          error = retryErr;
        }
      }

      // Extract accurate message from NestJS error response
      const errRes = error?.response?.data;
      const errCode = errRes?.error?.code;
      const errMsg =
        errRes?.error?.message ||
        (Array.isArray(errRes?.message) ? errRes.message.join(', ') : errRes?.message) ||
        error?.message ||
        'Please try again.';

      if (errCode === 'OTP_RATE_LIMITED' || error?.response?.status === 429) {
        Alert.alert('Too many attempts', 'Please wait a minute before requesting another code.');
      } else {
        Alert.alert('Error', `Failed to send OTP: ${errMsg}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!code || code.length < 6) {
      Alert.alert('Error', 'Please enter the 6-digit code.');
      return;
    }

    setIsLoading(true);
    const cleanIdentifier = identifier.trim();
    try {
      // Backend returns { accessToken, refreshToken, userId }
      const { accessToken } = await authService.verifyOtp(cleanIdentifier, code.trim(), isSignUp);
      signIn(accessToken);
      // The _layout route guard will automatically redirect us once authenticated.
    } catch (error: any) {
      const errCode = error?.response?.data?.error?.code;
      if (errCode === 'OTP_EXPIRED') {
        Alert.alert('Code expired', 'Your code has expired. Please request a new one.');
        setStep(1);
      } else if (errCode === 'OTP_MAX_ATTEMPTS') {
        Alert.alert('Too many attempts', 'Please request a new code.');
        setStep(1);
      } else {
        Alert.alert('Error', 'Incorrect code. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <View className="flex-1 px-6 justify-center">
        <View className="mb-8">
          <Text className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {step === 1 ? 'Enter your details' : 'Enter the code'}
          </Text>
          <Text className="text-base text-slate-500 dark:text-slate-400">
            {step === 1
              ? 'We will send you a one-time password to verify your account.'
              : `We sent a 6-digit code to ${identifier}.`}
          </Text>
        </View>

        {step === 1 ? (
          <View>
            <TextInput
              className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-4 rounded-xl text-lg mb-6"
              placeholder="Phone number or email"
              placeholderTextColor="#4A7A8A"
              value={identifier}
              onChangeText={setIdentifier}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => handleRequestOtp()}
              disabled={isLoading || timeLeft > 0}
              className={`w-full py-4 rounded-full flex-row justify-center items-center ${isLoading || timeLeft > 0 ? 'bg-blue-400' : 'bg-blue-600 active:bg-blue-700'}`}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-lg font-bold">
                  {timeLeft > 0 ? `Resend in ${timeLeft}s` : 'Send Code'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <TextInput
              className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-4 rounded-xl text-lg text-center tracking-widest mb-6"
              placeholder="000000"
              placeholderTextColor="#4A7A8A"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={handleVerifyOtp}
              disabled={isLoading}
              className="w-full bg-blue-600 active:bg-blue-700 py-4 rounded-full flex-row justify-center items-center"
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-lg font-bold">Verify</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleRequestOtp()}
              className="mt-6 p-2"
              disabled={isLoading || timeLeft > 0}
            >
              <Text className={`text-center font-semibold ${timeLeft > 0 ? 'text-slate-400' : 'text-blue-600'}`}>
                {timeLeft > 0 ? `Resend code in ${timeLeft}s` : 'Resend code'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setStep(1)}
              className="mt-4 p-2"
              disabled={isLoading}
            >
              <Text className="text-slate-500 text-center font-semibold">
                Change phone or email
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
