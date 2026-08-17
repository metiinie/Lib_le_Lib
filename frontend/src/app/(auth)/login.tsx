import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

/**
 * Login screen — SSO option list.
 *
 * Presents three login paths:
 *   Apple Sign In    → UI stub (Alert "Coming soon")
 *   Google Sign In   → UI stub (Alert "Coming soon")
 *   Continue with Phone → login-phone.tsx
 *
 * Apple SSO is listed first per Apple App Store guidelines: any app offering
 * third-party login must include Sign in with Apple and list it prominently.
 */
export default function LoginScreen() {
  const handleApple = () => {
    Alert.alert('Coming Soon', 'Apple Sign In will be available in the next update.');
  };

  const handleGoogle = () => {
    Alert.alert('Coming Soon', 'Google Sign In will be available in the next update.');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />

      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          id="login-back-btn"
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#0F1E24" />
        </TouchableOpacity>
      </View>

      <Animated.View
        entering={FadeInDown.duration(500)}
        style={styles.content}
      >
        <Text style={styles.title}>Login</Text>
        <Text style={styles.subtitle}>
          Choose how you'd like to sign in
        </Text>

        <View style={styles.buttonsContainer}>
          {/* Apple Sign In */}
          <TouchableOpacity
            id="login-apple-btn"
            style={styles.appleBtn}
            activeOpacity={0.85}
            onPress={handleApple}
          >
            <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
            <Text style={styles.appleBtnText}>Continue with Apple</Text>
          </TouchableOpacity>

          {/* Google Sign In */}
          <TouchableOpacity
            id="login-google-btn"
            style={styles.googleBtn}
            activeOpacity={0.85}
            onPress={handleGoogle}
          >
            {/* Google G — text approximation since no icon library has the exact branded G */}
            <Text style={styles.googleG}>G</Text>
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Phone + Password */}
          <TouchableOpacity
            id="login-phone-btn"
            style={styles.phoneBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/(auth)/login-phone')}
          >
            <Ionicons name="call-outline" size={20} color="#FFFFFF" />
            <Text style={styles.phoneBtnText}>Continue with Phone</Text>
          </TouchableOpacity>
        </View>

        {/* Register link */}
        <View style={styles.registerRow}>
          <Text style={styles.registerRowText}>Don't have an account?</Text>
          <TouchableOpacity
            id="login-go-register-btn"
            onPress={() => router.replace('/(auth)/register-phone')}
          >
            <Text style={styles.registerLink}> Register</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
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
    paddingTop: 8,
    paddingBottom: 4,
  },
  content: {
    flex: 1,
    paddingTop: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F1E24',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#4A7A8A',
    marginBottom: 40,
  },
  buttonsContainer: {
    gap: 14,
  },
  appleBtn: {
    backgroundColor: '#0F1E24',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
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
    paddingVertical: 16,
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
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D6DFE2',
  },
  dividerText: {
    color: '#6B9BAA',
    fontSize: 14,
  },
  phoneBtn: {
    backgroundColor: '#1B4D5C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 50,
    gap: 10,
    shadowColor: '#1B4D5C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  phoneBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  registerRowText: {
    color: '#4A7A8A',
    fontSize: 14,
  },
  registerLink: {
    color: '#1B4D5C',
    fontSize: 14,
    fontWeight: '700',
  },
});
