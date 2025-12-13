import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = 'https://pclpfemnokjgxidmjuzs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjbHBmZW1ub2tqZ3hpZG1qdXpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MzkyOTgsImV4cCI6MjA4MTAxNTI5OH0.t9oih6f63t_AZ37LNUl5alh8XpBstEDuD7hIAc3FN0U';

// Custom storage adapter using expo-secure-store for native, localStorage for web
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types (generated from schema)
export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  preferred_language: string;
  preferred_voice: string;
  daily_goal_minutes: number;
  notification_enabled: boolean;
  trial_started_at: string;
  purchased_at: string | null;
  purchase_product_id: string | null;
  purchase_platform: string | null;
  subscription_expires_at: string | null;
  total_sessions: number;
  total_practice_minutes: number;
  current_streak_days: number;
  longest_streak_days: number;
  last_practice_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccessStatus {
  has_access: boolean;
  access_type?: 'purchased' | 'subscription' | 'trial' | 'trial_expired';
  reason?: string;
  trial_ends_at?: string;
  days_remaining?: number;
  purchased_at?: string;
  expires_at?: string;
}

export interface ProgressSummary {
  total_sessions: number;
  total_practice_minutes: number;
  current_streak: number;
  longest_streak: number;
  today: {
    sessions: number;
    minutes: number;
    goal_met: boolean;
    best_score: number | null;
  };
  this_week: {
    practice_days: number;
    total_sessions: number;
    total_minutes: number;
    avg_score: number | null;
  };
}
