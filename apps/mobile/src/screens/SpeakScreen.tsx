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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SpeakStackParamList, DailyPrompt } from '../types';

type Props = NativeStackScreenProps<SpeakStackParamList, 'SpeakHome'>;

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

// Curated daily prompts with visual styling
const DAILY_PROMPTS: (DailyPrompt & { icon: string; gradient: string })[] = [
  {
    id: '1',
    mode: 'professional',
    title: 'Project Update',
    prompt: 'Share a 1-minute update on what you accomplished this week.',
    hints: ['Lead with wins', 'Mention challenges', 'Next week focus'],
    category: 'Work',
    icon: '📊',
    gradient: '#667eea',
  },
  {
    id: '2',
    mode: 'professional',
    title: 'Introduce Yourself',
    prompt: 'You just joined a new team meeting. Introduce yourself!',
    hints: ['Name & role', 'What you bring', 'Fun fact'],
    category: 'Networking',
    icon: '👋',
    gradient: '#f093fb',
  },
  {
    id: '3',
    mode: 'casual',
    title: 'Weekend Story',
    prompt: 'Tell a friend about something interesting from your weekend.',
    hints: ['Set the scene', 'What happened', 'Why memorable'],
    category: 'Social',
    icon: '☀️',
    gradient: '#4facfe',
  },
];

export default function SpeakScreen({ navigation }: Props) {
  const rootNavigation = useNavigation<any>();

  const handlePromptSelect = (prompt: DailyPrompt) => {
    navigation.navigate('Recording', { mode: prompt.mode, prompt });
  };

  const handleFreeTalk = () => {
    navigation.navigate('Recording', { mode: 'free_talk' });
  };

  const handleGoHome = () => {
    rootNavigation.navigate('Home');
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
            <Text style={styles.title}>1-Minute Workout</Text>
            <View style={styles.headerSpacer} />
          </View>
          <Text style={styles.subtitle}>Practice speaking daily</Text>
        </View>

        {/* Free Talk - Featured at Top */}
        <TouchableOpacity
          style={styles.freeTalkCard}
          onPress={handleFreeTalk}
          activeOpacity={0.85}
        >
          <View style={styles.freeTalkGradient} />
          <View style={styles.freeTalkContent}>
            <View style={styles.freeTalkLeft}>
              <Text style={styles.freeTalkIcon}>🎙️</Text>
              <View>
                <Text style={styles.freeTalkTitle}>Free Talk</Text>
                <Text style={styles.freeTalkSubtitle}>Speak about anything on your mind</Text>
              </View>
            </View>
            <View style={styles.freeTalkArrow}>
              <Text style={styles.freeTalkArrowText}>→</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daily Prompts</Text>
          <Text style={styles.sectionSubtitle}>Guided practice scenarios</Text>
        </View>

        {/* Compact Prompt Cards */}
        <View style={styles.cardsContainer}>
          {DAILY_PROMPTS.map((prompt) => (
            <TouchableOpacity
              key={prompt.id}
              style={styles.card}
              onPress={() => handlePromptSelect(prompt)}
              activeOpacity={0.85}
            >
              {/* Accent Line */}
              <View style={[styles.cardAccent, { backgroundColor: prompt.gradient }]} />

              <View style={styles.cardContent}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardIcon}>{prompt.icon}</Text>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{prompt.title}</Text>
                    <Text style={styles.cardPrompt} numberOfLines={1}>{prompt.prompt}</Text>
                  </View>
                  <View style={styles.cardArrow}>
                    <Text style={styles.cardArrowText}>→</Text>
                  </View>
                </View>

                {/* Compact hints as chips */}
                <View style={styles.hintsRow}>
                  {prompt.hints.map((hint, idx) => (
                    <View key={idx} style={styles.hintChip}>
                      <Text style={styles.hintText}>{hint}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          ))}
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
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  // Free Talk Featured Card
  freeTalkCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.backgroundSecondary,
  },
  freeTalkGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.primary,
    opacity: 0.15,
  },
  freeTalkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  freeTalkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  freeTalkIcon: {
    fontSize: 32,
    marginRight: 14,
  },
  freeTalkTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  freeTalkSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  freeTalkArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  freeTalkArrowText: {
    fontSize: 18,
    color: COLORS.text,
  },
  // Section Header
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  // Compact Cards
  cardsContainer: {
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.backgroundSecondary,
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 4,
  },
  cardContent: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingLeft: 18,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  cardPrompt: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  cardArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  cardArrowText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  // Hint Chips
  hintsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 6,
  },
  hintChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hintText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  bottomPadding: {
    height: 100,
  },
});
