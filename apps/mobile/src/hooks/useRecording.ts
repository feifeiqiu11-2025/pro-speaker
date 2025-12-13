import { useState, useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import { readAsStringAsync, deleteAsync, EncodingType } from 'expo-file-system/legacy';
import type { SessionMode, SessionResult } from '../types';
import { config } from '../utils/config';

interface UseRecordingOptions {
  mode: SessionMode;
  promptText?: string;
  onComplete?: (result: SessionResult) => void;
  onError?: (error: string) => void;
}

interface UseRecordingReturn {
  isRecording: boolean;
  isAnalyzing: boolean;
  duration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  error: string | null;
}

/**
 * Hook for managing audio recording and analysis
 * Records audio locally, then sends to backend for analysis
 */
export function useRecording({
  mode,
  promptText,
  onComplete,
  onError,
}: UseRecordingOptions): UseRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setDuration(0);

      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Microphone permission required');
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create recording with WAV format (Azure Speech SDK friendly)
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.wav',
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 256000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 256000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {},
      });

      await recording.startAsync();
      recordingRef.current = recording;

      // Start duration timer
      startTimeRef.current = Date.now();
      durationIntervalRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 100);

      setIsRecording(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recording';
      setError(message);
      onError?.(message);
    }
  }, [onError]);

  const stopRecording = useCallback(async () => {
    try {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      if (!recordingRef.current) {
        return;
      }

      setIsRecording(false);
      setIsAnalyzing(true);

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) {
        throw new Error('No recording URI');
      }

      // Read the audio file as base64
      const audioBase64 = await readAsStringAsync(uri, {
        encoding: EncodingType.Base64,
      });

      // Send to backend for analysis
      const response = await fetch(`${config.API_URL}/api/sessions/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio: audioBase64,
          mode,
          promptText,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Analysis failed');
      }

      // Transform backend response to SessionResult format
      const result: SessionResult = {
        transcript: data.data.pronunciation?.transcript || '',
        duration: Date.now() - startTimeRef.current,
        wordCount: data.data.pronunciation?.words?.length || 0,
        wpm: Math.round((data.data.pronunciation?.words?.length || 0) / ((Date.now() - startTimeRef.current) / 60000)),
        fillerCount: data.data.communication?.fillerWords?.total || 0,
        fillerBreakdown: data.data.communication?.fillerWords?.breakdown || {},
        communication: data.data.communication ? {
          fillerWords: {
            count: data.data.communication.fillerWords?.total || 0,
            instances: Object.keys(data.data.communication.fillerWords?.breakdown || {}),
            suggestion: data.data.communication.fillerWords?.suggestion || '',
          },
          pace: {
            wordsPerMinute: data.data.communication.pace?.wpm || 0,
            assessment: data.data.communication.pace?.assessment || 'good',
            suggestion: data.data.communication.pace?.suggestion || '',
          },
          grammar: {
            issueCount: data.data.communication.grammarIssues?.length || 0,
            issues: data.data.communication.grammarIssues || [],
          },
          structure: {
            score: data.data.communication.structure?.score || 0,
            assessment: data.data.communication.structure?.feedback || '',
            suggestion: '',
          },
          polishedVersion: data.data.communication.polishedVersion || '',
          coachingTip: data.data.communication.coachingTip || '',
          strengths: data.data.communication.strengths || [],
        } : undefined,
      };

      setIsAnalyzing(false);
      onComplete?.(result);

      // Clean up the audio file
      await deleteAsync(uri, { idempotent: true });
    } catch (err) {
      setIsAnalyzing(false);
      const message = err instanceof Error ? err.message : 'Failed to analyze recording';
      setError(message);
      onError?.(message);
    }
  }, [mode, promptText, onComplete, onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  return {
    isRecording,
    isAnalyzing,
    duration,
    startRecording,
    stopRecording,
    error,
  };
}
