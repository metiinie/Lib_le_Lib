import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { authService } from '@/services/auth.service';
import { normalizePhoneNumber, isValidPhoneNumber } from '@/utils/phone';

/**
 * Register — Step 1: Enter phone number.
 *
 * Sends an OTP SMS to the number and navigates to verify-otp.tsx.
 * Step indicator: 1 of 3 (auth steps only).
 */
export default function RegisterPhoneScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleApple = () => {
    Alert.alert('Coming Soon', 'Apple Sign In will be available in the next update.');
  };

  const handleGoogle = () => {
    Alert.alert('Coming Soon', 'Google Sign In will be available in the next update.');
  };

  const handleContinue = async () => {
    setError('');
    const normalized = normalizePhoneNumber(phone);

    if (!normalized) {
      setError('Please enter your phone number.');
      return;
    }
    if (!isValidPhoneNumber(normalized)) {
      setError('Please enter a valid phone number (e.g. 0911... or +251911...)');
      return;
    }

    setLoading(true);
    try {
      await authService.requestOtp(normalized, true);
      // Pass phone as a search param — verify-otp.tsx reads it with useLocalSearchParams
      router.push({ pathname: '/(auth)/verify-otp', params: { phone: normalized } });
    } catch (err: any) {
      const code = err?.response?.data?.error?.code;
      if (code === 'USER_ALREADY_EXISTS') {
        setError('This number is already registered. Please login instead.');
      } else if (code === 'OTP_RATE_LIMITED') {
        setError('Too many requests. Please wait a moment and try again.');
      } else {
        setError('Could not send OTP. Please check your number and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            id="register-phone-back-btn"
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#0F1E24" />
          </TouchableOpacity>

          {/* Step dots */}
          <View style={styles.stepDots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>

          <View style={{ width: 24 }} />
        </View>

        <Animated.View
          entering={FadeInDown.duration(450)}
          style={styles.content}
        >
          <Text style={styles.stepLabel}>Step 1 of 3</Text>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>
            Join Lib le Lib to find meaningful connections.
          </Text>

          <View style={styles.socialButtonsContainer}>
            {/* Apple Sign In */}
            <TouchableOpacity
              id="register-apple-btn"
              style={styles.appleBtn}
              activeOpacity={0.85}
              onPress={handleApple}
            >
              <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
              <Text style={styles.appleBtnText}>Continue with Apple</Text>
            </TouchableOpacity>

            {/* Google Sign In */}
            <TouchableOpacity
              id="register-google-btn"
              style={styles.googleBtn}
              activeOpacity={0.85}
              onPress={handleGoogle}
            >
              <Text style={styles.googleG}>G</Text>
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or register with phone</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Phone input */}
          <Text style={styles.label}>Phone number</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              id="register-phone-input"
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="0911... or +251 9__ ___ ____"
              placeholderTextColor="#4A7A8A"
              keyboardType="phone-pad"
              autoFocus
              autoCorrect={false}
              autoComplete="tel"
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />
          </View>

          {/* Error */}
          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color="#E07B6A" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Text style={styles.hint}>
            Already have an account?{' '}
            <Text
              style={styles.loginLink}
              onPress={() => router.replace('/(auth)/login')}
            >
              Login
            </Text>
          </Text>
        </Animated.View>

        {/* CTA pinned to bottom */}
        <View style={styles.footer}>
          <TouchableOpacity
            id="register-phone-continue-btn"
            style={[styles.continueBtn, loading && styles.continueBtnDisabled]}
            activeOpacity={0.85}
            onPress={handleContinue}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#EFF4F5" />
            ) : (
              <>
                <Text style={styles.continueBtnText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#EFF4F5" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F7F8',
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 8,
  },
  stepDots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D6DFE2',
  },
  dotActive: {
    backgroundColor: '#1B4D5C',
    width: 24,
  },
  content: {
    flex: 1,
    paddingTop: 32,
  },
  stepLabel: {
    fontSize: 12,
    color: '#4A7A8A',
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F1E24',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#4A7A8A',
    lineHeight: 22,
    marginBottom: 20,
  },
  socialButtonsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  appleBtn: {
    backgroundColor: '#0F1E24',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 50,
    gap: 10,
  },
  appleBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  googleBtn: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 50,
    gap: 10,
    borderWidth: 1,
    borderColor: '#D6DFE2',
  },
  googleG: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleBtnText: {
    color: '#0F1E24',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D6DFE2',
  },
  dividerText: {
    color: '#6B9BAA',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1B4D5C',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D6DFE2',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  input: {
    color: '#0F1E24',
    fontSize: 18,
    letterSpacing: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDF2F2',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#F8D7DA',
  },
  errorText: {
    color: '#B84C4C',
    fontSize: 14,
    flex: 1,
  },
  hint: {
    fontSize: 14,
    color: '#4A7A8A',
    marginTop: 20,
  },
  loginLink: {
    color: '#1B4D5C',
    fontWeight: '700',
  },
  footer: {
    paddingBottom: 32,
  },
  continueBtn: {
    backgroundColor: '#1B4D5C',
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#1B4D5C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  continueBtnDisabled: {
    opacity: 0.6,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
