import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRecording } from '../hooks/useRecording';
import type { RootStackParamList, SessionResult } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Recording'>;

const MAX_DURATION = 60; // 60 seconds max

export default function RecordingScreen({ navigation, route }: Props) {
  const { mode, prompt } = route.params;

  const handleComplete = useCallback(
    (result: SessionResult) => {
      navigation.replace('Feedback', { result });
    },
    [navigation]
  );

  const handleError = useCallback(
    (error: string) => {
      console.error('Recording error:', error);
    },
    []
  );

  const {
    isRecording,
    isAnalyzing,
    duration,
    startRecording,
    stopRecording,
    error,
  } = useRecording({
    mode,
    promptText: prompt?.prompt,
    onComplete: handleComplete,
    onError: handleError,
  });

  // Auto-stop at max duration
  useEffect(() => {
    if (isRecording && duration >= MAX_DURATION) {
      stopRecording();
    }
  }, [isRecording, duration, stopRecording]);

  // Format duration as mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRecordPress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleBack = () => {
    if (isRecording) {
      stopRecording();
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>

      {/* Prompt Display */}
      {prompt && (
        <View style={styles.promptContainer}>
          <Text style={styles.promptTitle}>{prompt.title}</Text>
          <Text style={styles.promptText}>{prompt.prompt}</Text>
        </View>
      )}

      {!prompt && (
        <View style={styles.promptContainer}>
          <Text style={styles.promptTitle}>Free Talk</Text>
          <Text style={styles.promptText}>
            Speak about anything for 1 minute. Practice makes perfect!
          </Text>
        </View>
      )}

      {/* Timer Display */}
      <View style={styles.timerContainer}>
        <View style={styles.timerCircle}>
          <View
            style={[
              styles.progressRing,
              { opacity: isRecording ? 1 : 0.3 },
            ]}
          />
          <View style={styles.timerInner}>
            <Text style={styles.timerText}>{formatDuration(duration)}</Text>
            <Text style={styles.timerLabel}>/ {formatDuration(MAX_DURATION)}</Text>
          </View>
        </View>
      </View>

      {/* Recording indicator */}
      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>Recording...</Text>
        </View>
      )}

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Record Button */}
      <View style={styles.buttonContainer}>
        {isAnalyzing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Analyzing your speech...</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordButtonActive]}
            onPress={handleRecordPress}
          >
            {isRecording ? (
              <View style={styles.stopIcon} />
            ) : (
              <View style={styles.micIcon}>
                <Text style={styles.micEmoji}>🎙️</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        <Text style={styles.recordHint}>
          {isAnalyzing ? '' : isRecording ? 'Tap to stop' : 'Tap to start recording'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    paddingVertical: 8,
  },
  backText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  promptContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  promptTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  promptText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
  },
  timerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    borderColor: '#2563EB',
  },
  timerInner: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  recordingIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    marginRight: 8,
  },
  recordingText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    marginHorizontal: 24,
    padding: 16,
    backgroundColor: '#7F1D1D',
    borderRadius: 12,
    marginBottom: 24,
  },
  errorText: {
    color: '#FEE2E2',
    fontSize: 14,
    textAlign: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
    paddingBottom: 48,
  },
  loadingContainer: {
    alignItems: 'center',
    height: 88,
    justifyContent: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 12,
  },
  recordButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  recordButtonActive: {
    backgroundColor: '#991B1B',
  },
  micIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micEmoji: {
    fontSize: 32,
  },
  stopIcon: {
    width: 28,
    height: 28,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  recordHint: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 16,
  },
});
