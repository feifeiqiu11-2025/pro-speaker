import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { Session, User, AuthError } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { supabase, Profile, AccessStatus } from '../lib/supabase';
import { FEATURES, GOOGLE_CONFIG } from '../config/constants';

// Initialize Google Sign-In
if (FEATURES.enableGoogleSignIn && GOOGLE_CONFIG.iosClientId) {
  GoogleSignin.configure({
    iosClientId: GOOGLE_CONFIG.iosClientId,
    webClientId: GOOGLE_CONFIG.webClientId,
  });
}

interface AuthContextType {
  // State
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  accessStatus: AccessStatus | null;
  isLoading: boolean;
  error: string | null;

  // Auth methods
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;

  // Profile methods
  refreshProfile: () => Promise<void>;
  refreshAccessStatus: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;

  // Utility
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accessStatus, setAccessStatus] = useState<AccessStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile from database
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return null;
      }

      return data as Profile;
    } catch (err) {
      console.error('Error in fetchProfile:', err);
      return null;
    }
  }, []);

  // Check user access status (trial/purchased)
  const checkAccessStatus = useCallback(async () => {
    try {
      const { data, error: accessError } = await supabase.rpc('check_user_access');

      if (accessError) {
        console.error('Error checking access:', accessError);
        return null;
      }

      return data as AccessStatus;
    } catch (err) {
      console.error('Error in checkAccessStatus:', err);
      return null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        const userProfile = await fetchProfile(initialSession.user.id);
        setProfile(userProfile);

        const status = await checkAccessStatus();
        setAccessStatus(status);
      }

      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event);
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          const userProfile = await fetchProfile(newSession.user.id);
          setProfile(userProfile);

          const status = await checkAccessStatus();
          setAccessStatus(status);
        } else {
          setProfile(null);
          setAccessStatus(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile, checkAccessStatus]);

  // Sign in with Apple (following KindleWood Kids patterns)
  const signInWithApple = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      setError('Apple Sign-In is only available on iOS');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        ],
      });

      const idToken = credential.identityToken;
      if (!idToken) {
        throw new Error('Failed to obtain Apple identity token');
      }

      // Handle name (only available on FIRST sign-in - Apple's behavior)
      let fullName: string | undefined;
      if (credential.fullName?.givenName || credential.fullName?.familyName) {
        const parts = [credential.fullName.givenName, credential.fullName.familyName]
          .filter(Boolean);
        fullName = parts.length > 0 ? parts.join(' ') : undefined;
      }

      // Sign into Supabase with Apple ID token
      // Note: NOT passing nonce to avoid validation issues (learned from KindleWood Kids)
      const { data, error: signInError } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: idToken,
      });

      if (signInError) {
        // Handle "unacceptable audience" error gracefully
        if (signInError.message.toLowerCase().includes('unacceptable audience')) {
          throw new Error('Apple sign-in configuration error. Please try again later.');
        }
        throw signInError;
      }

      // Update display name if we got it from Apple
      if (fullName && data.user) {
        await supabase
          .from('profiles')
          .update({ display_name: fullName })
          .eq('id', data.user.id);
      }
    } catch (err) {
      // Handle user cancellation gracefully
      if (err instanceof Error && err.message.includes('ERR_REQUEST_CANCELED')) {
        // User cancelled, not an error
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Apple sign-in failed';
      setError(errorMessage);
      console.error('Apple sign-in error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sign in with Google
  const signInWithGoogle = useCallback(async () => {
    if (!FEATURES.enableGoogleSignIn) {
      setError('Google Sign-In is not enabled');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Check if Google Play Services are available (Android)
      await GoogleSignin.hasPlayServices();

      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        throw new Error('Failed to obtain Google ID token');
      }

      // Sign into Supabase with Google ID token
      // Note: NOT passing nonce to avoid validation issues (learned from KindleWood Kids)
      const { data, error: signInError } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (signInError) {
        throw signInError;
      }

      // Update display name from Google if available
      if (userInfo.data?.user?.name && data.user) {
        await supabase
          .from('profiles')
          .update({
            display_name: userInfo.data.user.name,
            avatar_url: userInfo.data.user.photo || undefined,
          })
          .eq('id', data.user.id);
      }
    } catch (err) {
      // Handle user cancellation
      if (err instanceof Error && err.message.includes('SIGN_IN_CANCELLED')) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Google sign-in failed';
      setError(errorMessage);
      console.error('Google sign-in error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sign in with email/password
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Attempting sign in for:', email);

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Sign in response:', { user: data.user?.id, session: !!data.session });

      if (signInError) {
        throw signInError;
      }
    } catch (err) {
      const errorMessage = err instanceof AuthError
        ? err.message
        : 'Sign in failed. Please check your credentials.';
      setError(errorMessage);
      console.error('Email sign-in error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sign up with email/password
  const signUpWithEmail = useCallback(async (
    email: string,
    password: string,
    displayName?: string
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Attempting sign up for:', email);

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: displayName,
          },
        },
      });

      console.log('Sign up response:', { user: data.user?.id, session: !!data.session });

      if (signUpError) {
        throw signUpError;
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        // Email confirmation required - show message
        setError('Please check your email to confirm your account, then sign in.');
        return;
      }

      // Update display name if provided and we have a session
      if (displayName && data.user && data.session) {
        await supabase
          .from('profiles')
          .update({ display_name: displayName })
          .eq('id', data.user.id);
      }
    } catch (err) {
      const errorMessage = err instanceof AuthError
        ? err.message
        : 'Sign up failed. Please try again.';
      setError(errorMessage);
      console.error('Email sign-up error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Sign out from Google if signed in
      if (FEATURES.enableGoogleSignIn) {
        try {
          await GoogleSignin.signOut();
        } catch {
          // Ignore Google sign out errors
        }
      }

      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        throw signOutError;
      }

      setSession(null);
      setUser(null);
      setProfile(null);
      setAccessStatus(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign out failed';
      setError(errorMessage);
      console.error('Sign out error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'prospeaker://reset-password',
      });

      if (resetError) {
        throw resetError;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Password reset failed';
      setError(errorMessage);
      console.error('Password reset error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh profile
  const refreshProfile = useCallback(async () => {
    if (!user) return;

    const userProfile = await fetchProfile(user.id);
    setProfile(userProfile);
  }, [user, fetchProfile]);

  // Refresh access status
  const refreshAccessStatus = useCallback(async () => {
    const status = await checkAccessStatus();
    setAccessStatus(status);
  }, [checkAccessStatus]);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return;

    try {
      setError(null);

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      await refreshProfile();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Profile update failed';
      setError(errorMessage);
      console.error('Profile update error:', err);
    }
  }, [user, refreshProfile]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    session,
    user,
    profile,
    accessStatus,
    isLoading,
    error,
    signInWithApple,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    resetPassword,
    refreshProfile,
    refreshAccessStatus,
    updateProfile,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for using auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for checking if user has access (trial or purchased)
export function useHasAccess(): boolean {
  const { accessStatus } = useAuth();
  return accessStatus?.has_access ?? false;
}

// Hook for getting days remaining in trial
export function useTrialDaysRemaining(): number | null {
  const { accessStatus } = useAuth();
  if (accessStatus?.access_type === 'trial') {
    return accessStatus.days_remaining ?? null;
  }
  return null;
}
