import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

/**
 * Welcome screen — the app's first impression.
 *
 * Shows the brand identity, tagline, and two clear CTAs:
 *   Register → starts the registration wizard (phone → OTP → set-password → profile)
 *   Login    → goes to the login screen (Apple / Google / Phone options)
 *
 * Uses router.push (not replace) so the stack exists if the OS back gesture
 * is triggered, though in practice the route guard prevents reaching this
 * screen when authenticated.
 */
export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />

      {/* Brand section — top half */}
      <Animated.View
        entering={FadeInUp.delay(100).duration(700)}
        style={styles.brandSection}
      >
        <Text style={styles.logo}>Lib le Lib</Text>
        <Text style={styles.tagline}>Where love meets the soul</Text>
        <Text style={styles.subTagline}>
          A trusted, verified space for{'\n'}meaningful connections.
        </Text>
      </Animated.View>

      {/* CTA section — bottom */}
      <Animated.View
        entering={FadeInDown.delay(300).duration(700)}
        style={styles.ctaSection}
      >
        {/* Register */}
        <TouchableOpacity
          id="welcome-register-btn"
          style={styles.registerBtn}
          activeOpacity={0.85}
          onPress={() => router.push('/(auth)/register-phone')}
        >
          <Text style={styles.registerBtnText}>Register</Text>
        </TouchableOpacity>

        {/* Login */}
        <TouchableOpacity
          id="welcome-login-btn"
          style={styles.loginBtn}
          activeOpacity={0.85}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.loginBtnText}>Login</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0F1E24',
    paddingHorizontal: 24,
  },
  brandSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    fontSize: 38,
    fontWeight: '800',
    color: '#EFF4F5',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 18,
    color: '#4A9B7F',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  subTagline: {
    fontSize: 15,
    color: '#6B9BAA',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
  },
  ctaSection: {
    paddingBottom: 32,
    gap: 14,
  },
  registerBtn: {
    backgroundColor: '#1B4D5C',
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    // Subtle shadow for depth
    shadowColor: '#1B4D5C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  registerBtnText: {
    color: '#EFF4F5',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  loginBtn: {
    borderWidth: 1.5,
    borderColor: '#1B4D5C',
    paddingVertical: 15,
    borderRadius: 50,
    alignItems: 'center',
  },
  loginBtnText: {
    color: '#4A9B7F',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
