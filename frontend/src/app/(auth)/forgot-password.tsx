import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { authService } from '@/services/auth.service';

/**
 * Forgot Password screen.
 *
 * Accepts a phone number and calls POST /auth/password/forgot.
 * Always shows a "sent" confirmation — the backend never reveals whether
 * a number is registered (prevents phone enumeration).
 *
 * In dev mode: the reset token is logged to the NestJS console.
 * In prod: it would be sent via SMS.
 */
export default function ForgotPasswordScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    const trimmed = phone.trim();

    if (!trimmed) {
      setError('Please enter your phone number.');
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(trimmed);
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            id="forgot-password-back-btn"
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#EFF4F5" />
          </TouchableOpacity>
        </View>

        <Animated.View
          entering={FadeInDown.duration(450)}
          style={styles.content}
        >
          {!sent ? (
            <>
              <Text style={styles.title}>Forgot password?</Text>
              <Text style={styles.subtitle}>
                Enter your registered phone number. If it's in our system, we'll
                send a reset link.
              </Text>

              <Text style={styles.label}>Phone number</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  id="forgot-password-phone-input"
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+251 9__ ___ ____"
                  placeholderTextColor="#4A7A8A"
                  keyboardType="phone-pad"
                  autoFocus
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
              </View>

              {!!error && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color="#E07B6A" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
            </>
          ) : (
            /* Success state */
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={64} color="#4A9B7F" />
              </View>
              <Text style={styles.successTitle}>Check your phone</Text>
              <Text style={styles.successSubtitle}>
                If{' '}
                <Text style={{ color: '#4A9B7F', fontWeight: '600' }}>{phone}</Text>{' '}
                is registered, you'll receive a reset link shortly.
              </Text>
              <Text style={styles.successHint}>
                Didn't receive it? Check the number or contact support.
              </Text>
            </View>
          )}
        </Animated.View>

        {/* CTA */}
        {!sent ? (
          <View style={styles.footer}>
            <TouchableOpacity
              id="forgot-password-submit-btn"
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              activeOpacity={0.85}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#EFF4F5" />
              ) : (
                <Text style={styles.submitBtnText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.footer}>
            <TouchableOpacity
              id="forgot-password-back-to-login-btn"
              style={styles.backToLoginBtn}
              activeOpacity={0.85}
              onPress={() => router.replace('/(auth)/login-phone')}
            >
              <Text style={styles.backToLoginText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
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
    paddingTop: 8,
    paddingBottom: 4,
  },
  content: {
    flex: 1,
    paddingTop: 32,
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
  },
  input: {
    color: '#EFF4F5',
    fontSize: 18,
    letterSpacing: 0.5,
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
  // Success state
  successContainer: {
    alignItems: 'center',
    paddingTop: 40,
    gap: 16,
  },
  successIcon: {
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#EFF4F5',
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 15,
    color: '#6B9BAA',
    textAlign: 'center',
    lineHeight: 22,
  },
  successHint: {
    fontSize: 13,
    color: '#4A7A8A',
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    paddingBottom: 32,
  },
  submitBtn: {
    backgroundColor: '#1B4D5C',
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    shadowColor: '#1B4D5C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#EFF4F5',
    fontSize: 17,
    fontWeight: '700',
  },
  backToLoginBtn: {
    borderWidth: 1.5,
    borderColor: '#1B4D5C',
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
  },
  backToLoginText: {
    color: '#4A9B7F',
    fontSize: 17,
    fontWeight: '600',
  },
});
