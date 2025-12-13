import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

// Theme colors matching web app
const COLORS = {
  background: '#0F172A',
  backgroundSecondary: '#1E293B',
  primary: '#3B82F6',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: '#334155',
  success: '#10B981',
  error: '#EF4444',
};

export default function ProfileScreen() {
  const rootNavigation = useNavigation<any>();
  const { user, profile, accessStatus, signOut } = useAuth();

  const handleGoHome = () => {
    rootNavigation.navigate('Home');
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const getAccessBadge = () => {
    if (!accessStatus) return null;

    switch (accessStatus.access_type) {
      case 'purchased':
        return { text: 'Pro', color: COLORS.success };
      case 'subscription':
        return { text: 'Subscribed', color: COLORS.success };
      case 'trial':
        return {
          text: `Trial (${accessStatus.days_remaining}d left)`,
          color: COLORS.primary
        };
      default:
        return { text: 'Free', color: COLORS.textMuted };
    }
  };

  const badge = getAccessBadge();
  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'User';
  const email = user?.email || '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header with Home Button */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={handleGoHome} style={styles.homeButton}>
              <Text style={styles.homeIcon}>☰</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Profile</Text>
            <View style={styles.headerSpacer} />
          </View>
          <Text style={styles.subtitle}>Manage your account</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.email}>{email}</Text>
          {badge && (
            <View style={[styles.badge, { backgroundColor: `${badge.color}20` }]}>
              <Text style={[styles.badgeText, { color: badge.color }]}>
                {badge.text}
              </Text>
            </View>
          )}
        </View>

        {/* Stats Section (Placeholder) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {profile?.total_sessions || 0}
              </Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {profile?.total_practice_minutes || 0}
              </Text>
              <Text style={styles.statLabel}>Minutes</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {profile?.current_streak_days || 0}
              </Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuIcon}>🔔</Text>
              <Text style={styles.menuText}>Notifications</Text>
              <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuIcon}>🎯</Text>
              <Text style={styles.menuText}>Daily Goal</Text>
              <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuIcon}>🗣️</Text>
              <Text style={styles.menuText}>Voice Settings</Text>
              <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>

          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuIcon}>❓</Text>
              <Text style={styles.menuText}>Help & FAQ</Text>
              <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuIcon}>📝</Text>
              <Text style={styles.menuText}>Send Feedback</Text>
              <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuIcon}>📜</Text>
              <Text style={styles.menuText}>Terms of Service</Text>
              <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuIcon}>🔒</Text>
              <Text style={styles.menuText}>Privacy Policy</Text>
              <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.version}>ProSpeaker v1.0.0</Text>

        {/* Bottom padding for tab bar */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  homeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeIcon: {
    fontSize: 20,
    color: COLORS.text,
  },
  headerSpacer: {
    width: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  profileCard: {
    backgroundColor: COLORS.backgroundSecondary,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
  },
  displayName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  menuCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 14,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  menuArrow: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 50,
  },
  signOutButton: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
  },
  version: {
    textAlign: 'center',
    fontSize: 13,
    color: COLORS.textMuted,
  },
  bottomPadding: {
    height: 100,
  },
});
