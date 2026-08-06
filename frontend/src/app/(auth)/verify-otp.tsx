import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { authService } from '@/services/auth.service';

/**
 * Register — Step 2: OTP verification.
 *
 * Receives `phone` from register-phone.tsx via route params.
 * On success: navigates to set-password.tsx with { phone, tempToken }.
 * The tempToken is the accessToken returned by verifyOtp — it will be
 * passed to POST /auth/password/set but NOT stored in SecureStore.
 *
 * Constraints (per Mod 1 spec):
 *   - 6-digit code
 *   - 3 attempts max (backend enforced; frontend shows attempt counter)
 *   - 10-minute expiry (backend enforced; frontend shows countdown timer)
 *   - Resend button appears after 60 seconds
 */
export default function VerifyOtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [resendCountdown, setResendCountdown] = useState(60);
  const inputRef = useRef<TextInput>(null);

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((v) => Math.max(0, v - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const handleVerify = async () => {
    setError('');
    if (code.length !== 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }

    if (!phone) {
      setError('Phone number is missing. Please go back and try again.');
      return;
    }

    setLoading(true);
    try {
      const data = await authService.verifyOtp(phone, code, true);
      // Pass phone + temp access token to set-password
      // The temp token is only in-memory (route param) — never in SecureStore
      router.push({
        pathname: '/(auth)/set-password',
        params: { phone, tempToken: data.accessToken },
      });
    } catch (err: any) {
      const code = err?.response?.data?.error?.code;
      if (code === 'OTP_INVALID') {
        const left = attemptsLeft - 1;
        setAttemptsLeft(left);
        if (left <= 0) {
          setError('Maximum attempts reached. Please request a new OTP.');
        } else {
          setError(`Incorrect code. ${left} attempt${left === 1 ? '' : 's'} remaining.`);
        }
      } else if (code === 'OTP_EXPIRED') {
        setError('This code has expired. Please request a new one.');
      } else if (code === 'OTP_MAX_ATTEMPTS') {
        setError('Maximum attempts reached. Please request a new code.');
      } else {
        setError('Verification failed. Please try again.');
      }
      setCode('');
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!phone || resendCountdown > 0) return;
    setError('');
    setCode('');
    setAttemptsLeft(3);
    setResending(true);
    try {
      await authService.requestOtp(phone, true);
      setResendCountdown(60);
    } catch {
      setError('Could not resend OTP. Please try again shortly.');
    } finally {
      setResending(false);
    }
  };

  // Auto-verify when all 6 digits are entered
  const handleCodeChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    if (digits.length === 6) {
      // Small delay so the last digit renders before the request fires
      setTimeout(handleVerify, 150);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          id="verify-otp-back-btn"
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#EFF4F5" />
        </TouchableOpacity>

        {/* Step dots */}
        <View style={styles.stepDots}>
          <View style={[styles.dot, styles.dotDone]} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>

        <View style={{ width: 24 }} />
      </View>

      <Animated.View
        entering={FadeInDown.duration(450)}
        style={styles.content}
      >
        <Text style={styles.stepLabel}>Step 2 of 3</Text>
        <Text style={styles.title}>Verify your number</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to{'\n'}
          <Text style={styles.phoneHighlight}>{phone}</Text>
        </Text>

        {/* 6-digit OTP input */}
        <Text style={styles.label}>Verification code</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            id="verify-otp-input"
            style={styles.input}
            value={code}
            onChangeText={handleCodeChange}
            placeholder="• • • • • •"
            placeholderTextColor="#4A7A8A"
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleVerify}
          />
        </View>

        {/* Attempts indicator */}
        {attemptsLeft < 3 && attemptsLeft > 0 && (
          <Text style={styles.attemptsText}>
            {attemptsLeft} attempt{attemptsLeft === 1 ? '' : 's'} remaining
          </Text>
        )}

        {/* Error */}
        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color="#E07B6A" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Resend */}
        <View style={styles.resendRow}>
          <Text style={styles.resendLabel}>Didn't receive it? </Text>
          {resendCountdown > 0 ? (
            <Text style={styles.resendCountdown}>Resend in {resendCountdown}s</Text>
          ) : (
            <TouchableOpacity
              id="verify-otp-resend-btn"
              onPress={handleResend}
              disabled={resending}
            >
              {resending ? (
                <ActivityIndicator size="small" color="#4A9B7F" />
              ) : (
                <Text style={styles.resendLink}>Resend code</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Verify CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          id="verify-otp-submit-btn"
          style={[
            styles.verifyBtn,
            (loading || code.length !== 6 || attemptsLeft === 0) && styles.verifyBtnDisabled,
          ]}
          activeOpacity={0.85}
          onPress={handleVerify}
          disabled={loading || code.length !== 6 || attemptsLeft === 0}
        >
          {loading ? (
            <ActivityIndicator color="#EFF4F5" />
          ) : (
            <>
              <Text style={styles.verifyBtnText}>Verify</Text>
              <Ionicons name="arrow-forward" size={18} color="#EFF4F5" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0F1E24',
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
    backgroundColor: '#1B3D48',
  },
  dotActive: {
    backgroundColor: '#4A9B7F',
    width: 24,
  },
  dotDone: {
    backgroundColor: '#2A6B80',
    width: 8,
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
    color: '#EFF4F5',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B9BAA',
    lineHeight: 22,
    marginBottom: 36,
  },
  phoneHighlight: {
    color: '#4A9B7F',
    fontWeight: '600',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9BB5BE',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    backgroundColor: '#162A33',
    borderWidth: 1,
    borderColor: '#1B3D48',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  input: {
    color: '#EFF4F5',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 12,
    textAlign: 'center',
    width: '100%',
  },
  attemptsText: {
    color: '#D4784F',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'right',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2A1A18',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#3D1E1A',
  },
  errorText: {
    color: '#E07B6A',
    fontSize: 14,
    flex: 1,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  resendLabel: {
    color: '#4A7A8A',
    fontSize: 14,
  },
  resendCountdown: {
    color: '#4A7A8A',
    fontSize: 14,
    fontWeight: '500',
  },
  resendLink: {
    color: '#4A9B7F',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    paddingBottom: 32,
  },
  verifyBtn: {
    backgroundColor: '#1B4D5C',
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#1B4D5C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  verifyBtnDisabled: {
    opacity: 0.45,
  },
  verifyBtnText: {
    color: '#EFF4F5',
    fontSize: 17,
    fontWeight: '700',
  },
});
