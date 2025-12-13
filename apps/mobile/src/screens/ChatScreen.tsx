import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

// Theme colors matching web app
const COLORS = {
  background: '#0F172A',
  backgroundSecondary: '#1E293B',
  primary: '#3B82F6',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: '#334155',
};

const UPCOMING_FEATURES = [
  {
    icon: '💼',
    title: 'Job Interview Practice',
    description: 'Practice common interview questions with AI feedback on your responses.',
  },
  {
    icon: '🎤',
    title: 'Presentation Coach',
    description: 'Rehearse presentations and get tips on delivery, pacing, and engagement.',
  },
  {
    icon: '🤝',
    title: 'Meeting Simulator',
    description: 'Practice leading meetings, giving updates, and handling Q&A sessions.',
  },
  {
    icon: '💬',
    title: 'Small Talk Trainer',
    description: 'Build confidence in casual professional conversations.',
  },
];

export default function ChatScreen() {
  const navigation = useNavigation<any>();

  const handleGoHome = () => {
    navigation.navigate('Home');
  };

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
            <Text style={styles.title}>AI Chat Coach</Text>
            <View style={styles.headerSpacer} />
          </View>
          <Text style={styles.subtitle}>Coming Soon</Text>
        </View>

        {/* Coming Soon Card */}
        <View style={styles.comingSoonCard}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🚀</Text>
          </View>
          <Text style={styles.comingSoonTitle}>
            Interactive Speaking Practice
          </Text>
          <Text style={styles.comingSoonText}>
            Chat with an AI coach in real-time to practice professional
            conversations. Get instant feedback on your communication skills.
          </Text>
        </View>

        {/* Features Preview */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>What's Coming</Text>

          {UPCOMING_FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Notify Me */}
        <View style={styles.notifySection}>
          <TouchableOpacity style={styles.notifyButton} activeOpacity={0.8}>
            <Text style={styles.notifyButtonIcon}>🔔</Text>
            <Text style={styles.notifyButtonText}>Get Notified When Ready</Text>
          </TouchableOpacity>
          <Text style={styles.notifyHint}>
            We'll let you know when AI Chat Coach launches
          </Text>
        </View>

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
    color: COLORS.primary,
    textAlign: 'center',
    fontWeight: '600',
  },
  comingSoonCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    marginBottom: 32,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 36,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  comingSoonText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  notifySection: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  notifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  notifyButtonIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  notifyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  notifyHint: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 100,
  },
});
