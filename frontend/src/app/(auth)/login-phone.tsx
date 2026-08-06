import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/hooks/useAuth';

/**
 * Login with Phone screen — phone number + password.
 *
 * Reached from login.tsx → "Continue with Phone".
 * On success: stores both tokens → route guard resolves the post-login route.
 * On error: shows inline error message, never crashes.
 */
export default function LoginPhoneScreen() {
  const { signInWithTokens } = useAuth();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');

    if (!phone.trim()) {
      setError('Please enter your phone number.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const data = await authService.login(phone.trim(), password);
      signInWithTokens(data.accessToken, data.refreshToken);
      // Route guard in _layout.tsx takes over from here
    } catch (err: any) {
      const code = err?.response?.data?.error?.code;
      if (code === 'USER_NOT_FOUND') {
        setError('No account found for this number. Please register first.');
      } else if (code === 'INVALID_CREDENTIALS') {
        setError('Incorrect phone number or password.');
      } else if (code === 'PASSWORD_NOT_SET') {
        setError('No password set for this account. Use Forgot Password below.');
      } else {
        setError('Something went wrong. Please try again.');
      }
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
            id="login-phone-back-btn"
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#EFF4F5" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.duration(450)}>
            <Text style={styles.title}>Login with Phone</Text>
            <Text style={styles.subtitle}>Enter your number and password</Text>

            {/* Phone input */}
            <Text style={styles.label}>Phone number</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                id="login-phone-input"
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+251 9__ ___ ____"
                placeholderTextColor="#4A7A8A"
                keyboardType="phone-pad"
                autoCorrect={false}
                autoComplete="tel"
                returnKeyType="next"
              />
            </View>

            {/* Password input */}
            <Text style={[styles.label, { marginTop: 20 }]}>Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                id="login-password-input"
                style={[styles.input, { flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#4A7A8A"
                secureTextEntry={!showPassword}
                autoCorrect={false}
                autoComplete="current-password"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                id="login-toggle-password-btn"
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

            {/* Forgot password */}
            <TouchableOpacity
              id="login-forgot-password-btn"
              style={styles.forgotRow}
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Error */}
            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color="#E07B6A" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Login button */}
            <TouchableOpacity
              id="login-submit-btn"
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              activeOpacity={0.85}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#EFF4F5" />
              ) : (
                <Text style={styles.loginBtnText}>Login</Text>
              )}
            </TouchableOpacity>

            {/* Register link */}
            <View style={styles.registerRow}>
              <Text style={styles.registerRowText}>New here?</Text>
              <TouchableOpacity
                id="login-phone-go-register-btn"
                onPress={() => router.replace('/(auth)/register-phone')}
              >
                <Text style={styles.registerLink}> Create an account</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
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
  scroll: {
    paddingTop: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#EFF4F5',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B9BAA',
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
    flex: 1,
    color: '#EFF4F5',
    fontSize: 16,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: 12,
    marginBottom: 8,
  },
  forgotText: {
    color: '#4A9B7F',
    fontSize: 14,
    fontWeight: '500',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2A1A18',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#3D1E1A',
  },
  errorText: {
    color: '#E07B6A',
    fontSize: 14,
    flex: 1,
  },
  loginBtn: {
    backgroundColor: '#1B4D5C',
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#1B4D5C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: '#EFF4F5',
    fontSize: 17,
    fontWeight: '700',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  registerRowText: {
    color: '#6B9BAA',
    fontSize: 14,
  },
  registerLink: {
    color: '#4A9B7F',
    fontSize: 14,
    fontWeight: '600',
  },
});
