import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Feedback'>;

export default function FeedbackScreen({ navigation, route }: Props) {
  const { result } = route.params;
  const { communication } = result;

  const handleDone = () => {
    navigation.popToTop();
  };

  const handleTryAgain = () => {
    navigation.goBack();
  };

  // Get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  // Get assessment label
  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Work';
    return 'Keep Practicing';
  };

  // Format duration
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate overall score (simple average for now)
  const overallScore = communication
    ? Math.round(
        (communication.structure.score +
          (100 - communication.grammar.issueCount * 10) +
          (communication.pace.assessment === 'good' ? 100 : 70)) /
          3
      )
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Session Complete!</Text>
          <Text style={styles.subtitle}>
            {formatDuration(result.duration)} • {result.wordCount} words • {result.wpm} WPM
          </Text>
        </View>

        {/* Error State */}
        {result.error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Analysis Incomplete</Text>
            <Text style={styles.errorText}>{result.error}</Text>
          </View>
        )}

        {/* Overall Score */}
        {communication && (
          <View style={styles.scoreCard}>
            <View
              style={[
                styles.scoreBadge,
                { backgroundColor: getScoreColor(overallScore) },
              ]}
            >
              <Text style={styles.scoreNumber}>{overallScore}</Text>
            </View>
            <Text style={styles.scoreLabel}>{getScoreLabel(overallScore)}</Text>
          </View>
        )}

        {/* Coaching Tip */}
        {communication?.coachingTip && (
          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>💡</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Coach's Tip</Text>
              <Text style={styles.tipText}>{communication.coachingTip}</Text>
            </View>
          </View>
        )}

        {/* Strengths */}
        {communication?.strengths && communication.strengths.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Strengths</Text>
            <View style={styles.card}>
              {communication.strengths.map((strength, index) => (
                <View key={index} style={styles.strengthRow}>
                  <Text style={styles.strengthBullet}>✓</Text>
                  <Text style={styles.strengthText}>{strength}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Filler Words */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Filler Words</Text>
          <View style={styles.card}>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Count</Text>
              <Text
                style={[
                  styles.metricValue,
                  result.fillerCount > 3 && styles.metricWarning,
                ]}
              >
                {result.fillerCount}
              </Text>
            </View>
            {Object.entries(result.fillerBreakdown).length > 0 && (
              <View style={styles.fillerBreakdown}>
                {Object.entries(result.fillerBreakdown).map(([word, count]) => (
                  <View key={word} style={styles.fillerTag}>
                    <Text style={styles.fillerTagText}>
                      "{word}" × {count}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            {communication?.fillerWords.suggestion && (
              <Text style={styles.suggestionText}>
                {communication.fillerWords.suggestion}
              </Text>
            )}
          </View>
        </View>

        {/* Speaking Pace */}
        {communication && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Speaking Pace</Text>
            <View style={styles.card}>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Words per minute</Text>
                <Text style={styles.metricValue}>{result.wpm}</Text>
              </View>
              <Text style={styles.assessmentText}>
                {communication.pace.assessment === 'good'
                  ? '✓ Good pace'
                  : communication.pace.assessment === 'too_slow'
                  ? '⚠️ A bit slow'
                  : '⚠️ A bit fast'}
              </Text>
              <Text style={styles.suggestionText}>
                {communication.pace.suggestion}
              </Text>
            </View>
          </View>
        )}

        {/* Grammar Issues */}
        {communication && communication.grammar.issueCount > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Grammar Corrections</Text>
            <View style={styles.card}>
              {communication.grammar.issues.slice(0, 3).map((issue, index) => (
                <View key={index} style={styles.grammarIssue}>
                  <Text style={styles.grammarOriginal}>"{issue.original}"</Text>
                  <Text style={styles.grammarArrow}>→</Text>
                  <Text style={styles.grammarCorrected}>"{issue.corrected}"</Text>
                  <Text style={styles.grammarExplanation}>
                    {issue.explanation}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Polished Version */}
        {communication?.polishedVersion && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Polished Version</Text>
            <View style={styles.card}>
              <Text style={styles.polishedText}>
                {communication.polishedVersion}
              </Text>
            </View>
          </View>
        )}

        {/* Transcript */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Recording</Text>
          <View style={styles.card}>
            <Text style={styles.transcriptText}>
              {result.transcript || 'No speech detected'}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.tryAgainButton} onPress={handleTryAgain}>
            <Text style={styles.tryAgainText}>Try Again</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  errorCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#7F1D1D',
  },
  scoreCard: {
    alignItems: 'center',
    paddingVertical: 24,
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
    color: '#FFFFFF',
  },
  scoreLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
  },
  tipCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
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
    color: '#92400E',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  strengthRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  strengthBullet: {
    color: '#10B981',
    marginRight: 8,
    fontWeight: '600',
  },
  strengthText: {
    flex: 1,
    color: '#374151',
    fontSize: 14,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  metricWarning: {
    color: '#F59E0B',
  },
  fillerBreakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  fillerTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  fillerTagText: {
    fontSize: 12,
    color: '#92400E',
  },
  assessmentText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  grammarIssue: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  grammarOriginal: {
    fontSize: 14,
    color: '#EF4444',
    textDecorationLine: 'line-through',
  },
  grammarArrow: {
    fontSize: 14,
    color: '#9CA3AF',
    marginVertical: 4,
  },
  grammarCorrected: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  grammarExplanation: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  polishedText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  transcriptText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 12,
  },
  tryAgainButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2563EB',
    alignItems: 'center',
  },
  tryAgainText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
  doneButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    alignItems: 'center',
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomPadding: {
    height: 40,
  },
});
