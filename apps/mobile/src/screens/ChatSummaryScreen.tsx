import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { ConversationSummary, ChatStackParamList } from '../types/chat';

// Theme colors matching ChatScreen
const COLORS = {
  background: '#0F172A',
  backgroundSecondary: '#1E293B',
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: '#334155',
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
};

type ChatSummaryRouteProp = RouteProp<ChatStackParamList, 'ChatSummary'>;

export default function ChatSummaryScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<ChatSummaryRouteProp>();
  const { summary } = route.params;

  const handleChatAgain = () => {
    navigation.navigate('ChatMain');
  };

  const handleDone = () => {
    navigation.navigate('Home');
  };

  // Get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return COLORS.success;
    if (score >= 60) return COLORS.warning;
    return COLORS.error;
  };

  // Get assessment label
  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Work';
    return 'Keep Practicing';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Conversation Complete!</Text>
          <Text style={styles.subtitle}>Here's your feedback</Text>
        </View>

        {/* Overall Score */}
        <View style={styles.scoreCard}>
          <View
            style={[
              styles.scoreBadge,
              { backgroundColor: getScoreColor(summary.overallScore) },
            ]}
          >
            <Text style={styles.scoreNumber}>{summary.overallScore}</Text>
          </View>
          <Text style={styles.scoreLabel}>
            {getScoreLabel(summary.overallScore)}
          </Text>

          {/* Score Breakdown */}
          <View style={styles.scoreBreakdown}>
            <ScoreItem label="Pronunciation" score={summary.pronunciationScore} />
            <ScoreItem label="Clarity" score={summary.clarityScore} />
            <ScoreItem label="Fluency" score={summary.fluencyScore} />
          </View>
        </View>

        {/* Coaching Tip */}
        {summary.coachingTip && (
          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>💡</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Coach's Tip</Text>
              <Text style={styles.tipText}>{summary.coachingTip}</Text>
            </View>
          </View>
        )}

        {/* Strengths */}
        {summary.strengths && summary.strengths.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Strengths</Text>
            <View style={styles.card}>
              {summary.strengths.map((strength, index) => (
                <View key={index} style={styles.strengthRow}>
                  <Text style={styles.strengthBullet}>✓</Text>
                  <Text style={styles.strengthText}>{strength}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Communication Style (MBTI-inspired) */}
        {summary.communicationStyle && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Communication Style</Text>
            <View style={styles.card}>
              {summary.communicationStyle.styleIndicator && (
                <View style={styles.styleIndicatorBadge}>
                  <Text style={styles.styleIndicatorText}>
                    {summary.communicationStyle.styleIndicator}
                  </Text>
                </View>
              )}
              <Text style={styles.cardText}>
                {summary.communicationStyle.observation}
              </Text>
              <View style={styles.suggestionBox}>
                <Text style={styles.suggestionLabel}>Suggestion:</Text>
                <Text style={styles.suggestionText}>
                  {summary.communicationStyle.suggestion}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Pronunciation Notes */}
        {summary.pronunciationNotes && summary.pronunciationNotes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pronunciation Practice</Text>
            <View style={styles.card}>
              {summary.pronunciationNotes.map((note, index) => (
                <View key={index} style={styles.pronunciationRow}>
                  <View style={styles.pronunciationWordContainer}>
                    <Text style={styles.pronunciationWord}>"{note.word}"</Text>
                    {note.occurrences > 1 && (
                      <Text style={styles.occurrenceBadge}>
                        ×{note.occurrences}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.pronunciationArrow}>→</Text>
                  <Text style={styles.pronunciationSuggestion}>
                    {note.suggestion}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Filler Words */}
        {summary.communicationAnalysis.fillerWords.total > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Filler Words</Text>
            <View style={styles.card}>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Total count</Text>
                <Text
                  style={[
                    styles.metricValue,
                    summary.communicationAnalysis.fillerWords.total > 5 &&
                      styles.metricWarning,
                  ]}
                >
                  {summary.communicationAnalysis.fillerWords.total}
                </Text>
              </View>
              {Object.entries(
                summary.communicationAnalysis.fillerWords.breakdown
              ).length > 0 && (
                <View style={styles.fillerBreakdown}>
                  {Object.entries(
                    summary.communicationAnalysis.fillerWords.breakdown
                  ).map(([word, count]) => (
                    <View key={word} style={styles.fillerTag}>
                      <Text style={styles.fillerTagText}>
                        "{word}" × {count}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              {summary.communicationAnalysis.fillerWords.suggestion && (
                <Text style={styles.cardSuggestion}>
                  {summary.communicationAnalysis.fillerWords.suggestion}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Speaking Pace */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Speaking Pace</Text>
          <View style={styles.card}>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Words per minute</Text>
              <Text style={styles.metricValue}>
                {summary.communicationAnalysis.pace.averageWpm}
              </Text>
            </View>
            <Text style={styles.assessmentText}>
              {summary.communicationAnalysis.pace.assessment === 'good'
                ? '✓ Good pace'
                : summary.communicationAnalysis.pace.assessment.includes('slow')
                ? '⚠️ A bit slow'
                : '⚠️ A bit fast'}
            </Text>
            {summary.communicationAnalysis.pace.suggestion && (
              <Text style={styles.cardSuggestion}>
                {summary.communicationAnalysis.pace.suggestion}
              </Text>
            )}
          </View>
        </View>

        {/* Structure Feedback */}
        {summary.communicationAnalysis.structure && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Response Structure</Text>
            <View style={styles.card}>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Score</Text>
                <Text
                  style={[
                    styles.metricValue,
                    {
                      color: getScoreColor(
                        summary.communicationAnalysis.structure.score
                      ),
                    },
                  ]}
                >
                  {summary.communicationAnalysis.structure.score}
                </Text>
              </View>
              <Text style={styles.cardText}>
                {summary.communicationAnalysis.structure.feedback}
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.chatAgainButton}
            onPress={handleChatAgain}
          >
            <Text style={styles.chatAgainText}>Chat Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// SCORE ITEM COMPONENT
// ============================================================

interface ScoreItemProps {
  label: string;
  score: number;
}

function ScoreItem({ label, score }: ScoreItemProps) {
  const getColor = (s: number) => {
    if (s >= 80) return COLORS.success;
    if (s >= 60) return COLORS.warning;
    return COLORS.error;
  };

  return (
    <View style={styles.scoreItem}>
      <Text style={styles.scoreItemLabel}>{label}</Text>
      <Text style={[styles.scoreItemValue, { color: getColor(score) }]}>
        {score}
      </Text>
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

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
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  scoreCard: {
    alignItems: 'center',
    paddingVertical: 24,
    marginHorizontal: 20,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    marginBottom: 20,
  },
  scoreBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.text,
  },
  scoreLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 12,
  },
  scoreBreakdown: {
    flexDirection: 'row',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    width: '100%',
    justifyContent: 'space-around',
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreItemLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  scoreItemValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  tipCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  tipIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.warning,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  styleIndicatorBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  styleIndicatorText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  suggestionBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  suggestionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 14,
    color: COLORS.primary,
    lineHeight: 20,
  },
  strengthRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  strengthBullet: {
    color: COLORS.success,
    marginRight: 10,
    fontWeight: '600',
    fontSize: 16,
  },
  strengthText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },
  pronunciationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  pronunciationWordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pronunciationWord: {
    fontSize: 14,
    color: COLORS.warning,
    fontWeight: '500',
  },
  occurrenceBadge: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  pronunciationArrow: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginHorizontal: 8,
  },
  pronunciationSuggestion: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '500',
    flex: 1,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  metricWarning: {
    color: COLORS.warning,
  },
  fillerBreakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    marginTop: 4,
  },
  fillerTag: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  fillerTagText: {
    fontSize: 12,
    color: COLORS.warning,
  },
  assessmentText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 8,
  },
  cardSuggestion: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 12,
  },
  chatAgainButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
  },
  chatAgainText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  doneButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  bottomPadding: {
    height: 40,
  },
});
