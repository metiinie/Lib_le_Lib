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
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/hooks/useAuth';

/**
 * Register — Step 3: Set password.
 *
 * Receives { phone, tempToken } from verify-otp.tsx via route params.
 * The tempToken is used in the Authorization header for POST /auth/password/set.
 * On success: stores the FINAL token pair → route guard takes over.
 *
 * Password rules (enforced both client-side and server-side):
 *   - Min 8 characters
 *   - At least 1 number
 *   - At least 1 symbol
 */
export default function SetPasswordScreen() {
  const { phone, tempToken } = useLocalSearchParams<{
    phone: string;
    tempToken: string;
  }>();
  const { signInWithTokens } = useAuth();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = (): string | null => {
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (!/\d/.test(password)) return 'Password must contain at least one number.';
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password))
      return 'Password must contain at least one symbol.';
    if (password !== confirm) return 'Passwords do not match.';
    return null;
  };

  const handleSetPassword = async () => {
    setError('');
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!phone || !tempToken) {
      setError('Session expired. Please start registration again.');
      router.replace('/(auth)/register-phone');
      return;
    }

    setLoading(true);
    try {
      // The api interceptor will attach the tempToken from the Authorization header.
      // We set it temporarily on the store so the request interceptor picks it up.
      // It will be overwritten immediately with the real tokens on success.
      const { setToken } = await import('@/state/auth.store').then(
        (m) => m.useAuthStore.getState(),
      );
      setToken(tempToken);

      const data = await authService.setPassword(phone, password);

      // Overwrite with real tokens — this starts the actual session
      signInWithTokens(data.accessToken, data.refreshToken);
      // Route guard in _layout.tsx detects isAuthenticated → resolves post-login route
    } catch (err: any) {
      const code = err?.response?.data?.error?.code;
      if (code === 'USER_NOT_FOUND') {
        setError('Registration session expired. Please start again.');
        router.replace('/(auth)/register-phone');
      } else {
        setError('Failed to set password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Live strength indicators
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

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
            id="set-password-back-btn"
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#EFF4F5" />
          </TouchableOpacity>

          {/* Step dots */}
          <View style={styles.stepDots}>
            <View style={[styles.dot, styles.dotDone]} />
            <View style={[styles.dot, styles.dotDone]} />
            <View style={[styles.dot, styles.dotActive]} />
          </View>

          <View style={{ width: 24 }} />
        </View>

        <Animated.View
          entering={FadeInDown.duration(450)}
          style={styles.content}
        >
          <Text style={styles.stepLabel}>Step 3 of 3</Text>
          <Text style={styles.title}>Create a password</Text>
          <Text style={styles.subtitle}>
            This is how you'll log in from now on. Keep it safe.
          </Text>

          {/* Password input */}
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              id="set-password-input"
              style={[styles.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 8 characters"
              placeholderTextColor="#4A7A8A"
              secureTextEntry={!showPassword}
              autoCorrect={false}
              autoComplete="new-password"
              returnKeyType="next"
            />
            <TouchableOpacity
              id="set-password-toggle-btn"
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#4A7A8A"
              />
            </TouchableOpacity>
          </View>

          {/* Strength indicators */}
          <View style={styles.strengthRow}>
            <StrengthBadge met={hasMinLength} label="8+ chars" />
            <StrengthBadge met={hasNumber} label="Number" />
            <StrengthBadge met={hasSymbol} label="Symbol" />
          </View>

          {/* Confirm password */}
          <Text style={[styles.label, { marginTop: 20 }]}>Confirm password</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              id="set-password-confirm-input"
              style={[styles.input, { flex: 1 }]}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Re-enter your password"
              placeholderTextColor="#4A7A8A"
              secureTextEntry={!showConfirm}
              autoCorrect={false}
              autoComplete="new-password"
              returnKeyType="done"
              onSubmitEditing={handleSetPassword}
            />
            <TouchableOpacity
              id="set-password-toggle-confirm-btn"
              onPress={() => setShowConfirm((v) => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#4A7A8A"
              />
            </TouchableOpacity>
          </View>

          {/* Error */}
          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color="#E07B6A" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </Animated.View>

        {/* CTA */}
        <View style={styles.footer}>
          <TouchableOpacity
            id="set-password-submit-btn"
            style={[styles.continueBtn, loading && styles.continueBtnDisabled]}
            activeOpacity={0.85}
            onPress={handleSetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#EFF4F5" />
            ) : (
              <>
                <Text style={styles.continueBtnText}>Create Account</Text>
                <Ionicons name="checkmark" size={18} color="#EFF4F5" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StrengthBadge({ met, label }: { met: boolean; label: string }) {
  return (
    <View
      style={[
        strengthStyles.badge,
        met ? strengthStyles.met : strengthStyles.unmet,
      ]}
    >
      <Ionicons
        name={met ? 'checkmark-circle' : 'ellipse-outline'}
        size={12}
        color={met ? '#4A9B7F' : '#4A7A8A'}
      />
      <Text style={[strengthStyles.label, met && strengthStyles.labelMet]}>
        {label}
      </Text>
    </View>
  );
}

const strengthStyles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  met: {
    borderColor: '#4A9B7F',
    backgroundColor: 'rgba(74, 155, 127, 0.1)',
  },
  unmet: {
    borderColor: '#1B3D48',
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 12,
    color: '#4A7A8A',
  },
  labelMet: {
    color: '#4A9B7F',
  },
});

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
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9BB5BE',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#162A33',
    borderWidth: 1,
    borderColor: '#1B3D48',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  input: {
    color: '#EFF4F5',
    fontSize: 16,
  },
  strengthRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
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
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  continueBtnDisabled: {
    opacity: 0.6,
  },
  continueBtnText: {
    color: '#EFF4F5',
    fontSize: 17,
    fontWeight: '700',
  },
});
