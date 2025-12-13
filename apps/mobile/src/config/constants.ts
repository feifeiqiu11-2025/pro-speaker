import { Platform } from 'react-native';

// App Configuration
export const APP_CONFIG = {
  name: 'ProSpeaker',
  bundleId: 'com.kindlewoodstudios.prospeaker',
  version: '1.0.0',
};

// Feature Flags
export const FEATURES = {
  enableGoogleSignIn: true,
  enableAppleSignIn: Platform.OS === 'ios', // Apple Sign-In only on iOS
  enableEmailAuth: true,
};

// IAP Product IDs
export const IAP_PRODUCTS = {
  lifetime: 'com.kindlewoodstudios.prospeaker.lifetime',
};

// Trial Configuration
export const TRIAL_CONFIG = {
  durationDays: 7,
};

// Google Sign-In Configuration
// Note: Replace with actual client IDs from Google Cloud Console
export const GOOGLE_CONFIG = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
};

// API Configuration
export const API_CONFIG = {
  // Production URL (Railway deployment)
  baseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://pro-speakerbackend-production.up.railway.app',
  // WebSocket URL
  wsUrl: process.env.EXPO_PUBLIC_WS_URL || 'wss://pro-speakerbackend-production.up.railway.app',
};

// Convenience exports
export const API_URL = API_CONFIG.baseUrl;
export const WS_URL = API_CONFIG.wsUrl;

// Recording Configuration
export const RECORDING_CONFIG = {
  sampleRate: 16000,
  channels: 1,
  bitDepth: 16,
  maxDurationSeconds: 300, // 5 minutes max
};

// Privacy & Legal URLs
export const LEGAL_URLS = {
  privacyPolicy: 'https://www.kindlewoodstudio.ai/pro-speaker',
  termsOfService: 'https://www.kindlewoodstudio.ai/pro-speaker/terms',
  support: 'https://www.kindlewoodstudio.ai/pro-speaker/support',
  supportEmail: 'support@kindlewoodstudio.ai',
};
