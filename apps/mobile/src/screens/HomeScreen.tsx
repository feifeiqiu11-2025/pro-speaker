import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// Theme colors
const COLORS = {
  background: '#0F172A',
  backgroundSecondary: '#1E293B',
  primary: '#3B82F6',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: '#334155',
};

interface HomeScreenProps {
  onNavigateToTab: (tabName: string) => void;
}

const FEATURES = [
  {
    id: 'speak',
    icon: '🎙️',
    title: 'Speak',
    subtitle: '1-Minute Workout',
    description: 'Practice speaking with daily prompts and get AI feedback',
    gradient: ['#667eea', '#764ba2'] as const,
    tabName: 'SpeakTab',
  },
  {
    id: 'listen',
    icon: '🎧',
    title: 'Listen & Read',
    subtitle: 'Daily Tech News',
    description: 'Improve pronunciation with curated articles',
    gradient: ['#4facfe', '#00f2fe'] as const,
    tabName: 'ListenReadTab',
  },
  {
    id: 'chat',
    icon: '💬',
    title: 'Chat Coach',
    subtitle: 'Coming Soon',
    description: 'Practice conversations for interviews & presentations',
    gradient: ['#f093fb', '#f5576c'] as const,
    tabName: 'ChatTab',
  },
  {
    id: 'profile',
    icon: '📊',
    title: 'Progress',
    subtitle: 'Track & Improve',
    description: 'Monitor your speaking stats and streaks',
    gradient: ['#11998e', '#38ef7d'] as const,
    tabName: 'ProfileTab',
  },
];

export default function HomeScreen({ onNavigateToTab }: HomeScreenProps) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>🎙️</Text>
            <View>
              <Text style={styles.appName}>ProSpeaker</Text>
              <Text style={styles.tagline}>1-Minute Speaking Workout</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            Speak with confidence, communicate with impact
          </Text>
        </View>

        {/* Feature Tiles */}
        <View style={styles.tilesContainer}>
          {FEATURES.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={styles.tile}
              onPress={() => onNavigateToTab(feature.tabName)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[feature.gradient[0], feature.gradient[1]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tileGradient}
              />
              <View style={styles.tileContent}>
                <Text style={styles.tileIcon}>{feature.icon}</Text>
                <View style={styles.tileTextContainer}>
                  <Text style={styles.tileTitle}>{feature.title}</Text>
                  <Text style={styles.tileSubtitle}>{feature.subtitle}</Text>
                </View>
                <Text style={styles.tileDescription}>{feature.description}</Text>
                <View style={styles.tileArrow}>
                  <Text style={styles.tileArrowText}>→</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom padding */}
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 28,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoIcon: {
    fontSize: 40,
    marginRight: 14,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  tilesContainer: {
    paddingHorizontal: 20,
  },
  tile: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    height: 130,
  },
  tileGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.15,
  },
  tileContent: {
    flex: 1,
    padding: 18,
    backgroundColor: COLORS.backgroundSecondary,
  },
  tileIcon: {
    fontSize: 26,
    position: 'absolute',
    top: 14,
    right: 14,
  },
  tileTextContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  tileTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginRight: 10,
  },
  tileSubtitle: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  tileDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    paddingRight: 40,
  },
  tileArrow: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileArrowText: {
    fontSize: 16,
    color: COLORS.text,
  },
  bottomPadding: {
    height: 100,
  },
});
