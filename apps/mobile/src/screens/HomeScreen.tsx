import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, DailyPrompt } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const { width } = Dimensions.get('window');

// Curated daily prompts with visual styling
const DAILY_PROMPTS: (DailyPrompt & { icon: string; gradient: string[] })[] = [
  {
    id: '1',
    mode: 'professional',
    title: 'Project Update',
    prompt: 'Share a 1-minute update on what you accomplished this week.',
    hints: [
      'Lead with your biggest win',
      'Mention one challenge you solved',
      'Share your focus for next week',
    ],
    category: 'Work',
    icon: '📊',
    gradient: ['#667eea', '#764ba2'],
  },
  {
    id: '2',
    mode: 'professional',
    title: 'Introduce Yourself',
    prompt: 'You just joined a new team meeting. Introduce yourself!',
    hints: [
      'Your name and role',
      'What you bring to the team',
      'A fun fact about you',
    ],
    category: 'Networking',
    icon: '👋',
    gradient: ['#f093fb', '#f5576c'],
  },
  {
    id: '3',
    mode: 'casual',
    title: 'Weekend Story',
    prompt: 'Tell a friend about something interesting from your weekend.',
    hints: [
      'Set the scene - where were you?',
      'What happened?',
      'Why was it memorable?',
    ],
    category: 'Social',
    icon: '☀️',
    gradient: ['#4facfe', '#00f2fe'],
  },
];

export default function HomeScreen({ navigation }: Props) {
  const handlePromptSelect = (prompt: DailyPrompt) => {
    navigation.navigate('Recording', { mode: prompt.mode, prompt });
  };

  const handleFreeTalk = () => {
    navigation.navigate('Recording', { mode: 'free_talk' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Ready to practice?</Text>
          <Text style={styles.title}>1-Minute Workout</Text>
        </View>

        {/* Prompt Cards */}
        <View style={styles.cardsContainer}>
          {DAILY_PROMPTS.map((prompt, index) => (
            <TouchableOpacity
              key={prompt.id}
              style={styles.card}
              onPress={() => handlePromptSelect(prompt)}
              activeOpacity={0.9}
            >
              {/* Gradient Background */}
              <View
                style={[
                  styles.cardGradient,
                  { backgroundColor: prompt.gradient[0] }
                ]}
              />

              {/* Card Content */}
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardIcon}>{prompt.icon}</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{prompt.category}</Text>
                  </View>
                </View>

                <Text style={styles.cardTitle}>{prompt.title}</Text>
                <Text style={styles.cardPrompt}>{prompt.prompt}</Text>

                <View style={styles.hintsContainer}>
                  {prompt.hints.map((hint, idx) => (
                    <View key={idx} style={styles.hintRow}>
                      <View style={styles.hintDot} />
                      <Text style={styles.hintText}>{hint}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.startButton}>
                  <Text style={styles.startButtonText}>Start Speaking</Text>
                  <Text style={styles.startArrow}>→</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Free Talk Option */}
        <TouchableOpacity
          style={styles.freeTalkCard}
          onPress={handleFreeTalk}
          activeOpacity={0.8}
        >
          <View style={styles.freeTalkContent}>
            <Text style={styles.freeTalkIcon}>🎙️</Text>
            <View style={styles.freeTalkText}>
              <Text style={styles.freeTalkTitle}>Free Talk</Text>
              <Text style={styles.freeTalkSubtitle}>Speak about anything</Text>
            </View>
          </View>
          <Text style={styles.freeTalkArrow}>→</Text>
        </TouchableOpacity>

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardsContainer: {
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIcon: {
    fontSize: 32,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  cardPrompt: {
    fontSize: 15,
    color: '#CBD5E1',
    lineHeight: 22,
    marginBottom: 16,
  },
  hintsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  hintDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#64748B',
    marginRight: 10,
    marginTop: 6,
  },
  hintText: {
    flex: 1,
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  startArrow: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  freeTalkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    marginHorizontal: 20,
    marginTop: 8,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
  },
  freeTalkContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  freeTalkIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  freeTalkText: {
    flexDirection: 'column',
  },
  freeTalkTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  freeTalkSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  freeTalkArrow: {
    fontSize: 20,
    color: '#64748B',
  },
  bottomPadding: {
    height: 20,
  },
});
