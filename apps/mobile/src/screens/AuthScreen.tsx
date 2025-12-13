import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuth } from '../context/AuthContext';
import { FEATURES } from '../config/constants';

type AuthMode = 'signin' | 'signup' | 'forgot';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Theme colors matching web app
const COLORS = {
  background: '#0F172A',
  backgroundSecondary: '#1E293B',
  primary: '#3B82F6',
  primaryHover: '#2563EB',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: '#334155',
  card: 'rgba(255, 255, 255, 0.5)',
  cardSolid: '#1E293B',
  success: '#10B981',
  error: '#EF4444',
};

export default function AuthScreen() {
  const {
    signInWithApple,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    isLoading,
    error,
    clearError,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);

  const handleEmailAuth = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address');
      return;
    }

    if (mode === 'forgot') {
      await resetPassword(email);
      Alert.alert(
        'Check Your Email',
        'We sent you a password reset link. Please check your inbox.',
        [{ text: 'OK', onPress: () => setMode('signin') }]
      );
      return;
    }

    if (!password || password.length < 6) {
      Alert.alert('Password Required', 'Password must be at least 6 characters');
      return;
    }

    if (mode === 'signup') {
      await signUpWithEmail(email, password, displayName || undefined);
    } else {
      await signInWithEmail(email, password);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    clearError();
    setMode(newMode);
    setPassword('');
  };

  return (
    <View style={styles.container}>
      {/* Dark blue gradient background */}
      <LinearGradient
        colors={[COLORS.background, COLORS.backgroundSecondary, COLORS.background]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoIcon}>
                <Text style={styles.logoEmoji}>🎙️</Text>
              </View>
            </View>
            <Text style={styles.logo}>ProSpeaker</Text>
            <Text style={styles.tagline}>1-Minute Speaking Workout</Text>
            <Text style={styles.subtitle}>
              Speak with confidence, communicate with impact
            </Text>
          </View>

          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={clearError} style={styles.dismissButton}>
                <Text style={styles.dismissText}>×</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Auth Card - Semi-transparent */}
          <View style={styles.authCard}>
            {/* OAuth Buttons */}
            {!showEmailForm && (
              <View style={styles.oauthContainer}>
                {/* Apple Sign-In - MUST be first per App Store guideline 4.8 */}
                {FEATURES.enableAppleSignIn && Platform.OS === 'ios' && (
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                    cornerRadius={12}
                    style={styles.appleButton}
                    onPress={signInWithApple}
                  />
                )}

                {/* Google Sign-In */}
                {FEATURES.enableGoogleSignIn && (
                  <TouchableOpacity
                    style={styles.socialButton}
                    onPress={signInWithGoogle}
                    disabled={isLoading}
                  >
                    <Text style={styles.socialButtonIcon}>G</Text>
                    <Text style={styles.socialButtonText}>
                      Continue with Google
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Divider */}
                {FEATURES.enableEmailAuth && (
                  <View style={styles.dividerContainer}>
                    <View style={styles.divider} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.divider} />
                  </View>
                )}

                {/* Email Sign-In Option */}
                {FEATURES.enableEmailAuth && (
                  <TouchableOpacity
                    style={styles.emailButton}
                    onPress={() => setShowEmailForm(true)}
                    disabled={isLoading}
                  >
                    <Text style={styles.emailButtonText}>
                      Continue with Email
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Email Form */}
            {showEmailForm && (
              <View style={styles.formContainer}>
                <Text style={styles.formTitle}>
                  {mode === 'signin' && 'Welcome Back'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'forgot' && 'Reset Password'}
                </Text>
                <Text style={styles.formSubtitle}>
                  {mode === 'signin' && 'Sign in to continue your journey'}
                  {mode === 'signup' && 'Start your speaking transformation'}
                  {mode === 'forgot' && 'Enter your email to reset password'}
                </Text>

                {mode === 'signup' && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="John Doe"
                      placeholderTextColor={COLORS.textMuted}
                      value={displayName}
                      onChangeText={setDisplayName}
                      autoCapitalize="words"
                      editable={!isLoading}
                    />
                  </View>
                )}

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor={COLORS.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>

                {mode !== 'forgot' && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor={COLORS.textMuted}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      editable={!isLoading}
                    />
                  </View>
                )}

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleEmailAuth}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {mode === 'signin' && 'Sign In'}
                      {mode === 'signup' && 'Create Account'}
                      {mode === 'forgot' && 'Send Reset Link'}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Mode Switchers */}
                <View style={styles.modeSwitchContainer}>
                  {mode === 'signin' && (
                    <>
                      <TouchableOpacity onPress={() => switchMode('signup')}>
                        <Text style={styles.linkText}>
                          New here? <Text style={styles.linkBold}>Create account</Text>
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => switchMode('forgot')}>
                        <Text style={styles.forgotText}>Forgot password?</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {mode === 'signup' && (
                    <TouchableOpacity onPress={() => switchMode('signin')}>
                      <Text style={styles.linkText}>
                        Have an account? <Text style={styles.linkBold}>Sign in</Text>
                      </Text>
                    </TouchableOpacity>
                  )}
                  {mode === 'forgot' && (
                    <TouchableOpacity onPress={() => switchMode('signin')}>
                      <Text style={styles.linkText}>
                        <Text style={styles.linkBold}>Back to sign in</Text>
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Back to OAuth options */}
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    setShowEmailForm(false);
                    clearError();
                  }}
                >
                  <Text style={styles.backButtonText}>← Other sign-in options</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Loading Overlay */}
            {isLoading && !showEmailForm && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Signing in...</Text>
              </View>
            )}
          </View>

          {/* Features Preview */}
          {!showEmailForm && (
            <View style={styles.featuresPreview}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🎯</Text>
                <Text style={styles.featureText}>AI Feedback</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📈</Text>
                <Text style={styles.featureText}>Track Progress</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>⚡</Text>
                <Text style={styles.featureText}>1-Min Practice</Text>
              </View>
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.trialBadge}>
              <Text style={styles.trialBadgeText}>7-Day Free Trial</Text>
            </View>
            <Text style={styles.footerText}>
              By continuing, you agree to our{' '}
              <Text style={styles.footerLink} onPress={() => {}}>
                Terms
              </Text>
              {' & '}
              <Text style={styles.footerLink} onPress={() => {}}>
                Privacy Policy
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: SCREEN_HEIGHT * 0.08,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  logoEmoji: {
    fontSize: 40,
  },
  logo: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 22,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#FCA5A5',
    flex: 1,
    marginRight: 8,
    fontSize: 14,
  },
  dismissButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissText: {
    color: '#FCA5A5',
    fontSize: 20,
    fontWeight: '300',
  },
  authCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  oauthContainer: {
    gap: 12,
  },
  appleButton: {
    width: '100%',
    height: 52,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    height: 52,
    gap: 12,
  },
  socialButtonIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4285F4',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#D1D5DB',
  },
  dividerText: {
    color: '#6B7280',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  emailButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emailButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  formContainer: {
    gap: 16,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 8,
  },
  inputContainer: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 4,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  modeSwitchContainer: {
    gap: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  linkText: {
    color: '#4B5563',
    fontSize: 14,
  },
  linkBold: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  forgotText: {
    color: '#6B7280',
    fontSize: 14,
  },
  backButton: {
    marginTop: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#6B7280',
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#4B5563',
    fontSize: 14,
  },
  featuresPreview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 32,
    paddingHorizontal: 8,
  },
  featureItem: {
    alignItems: 'center',
    gap: 6,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
    gap: 12,
  },
  trialBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  trialBadgeText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: COLORS.primary,
  },
});
