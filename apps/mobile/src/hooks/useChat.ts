import { useState, useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import { readAsStringAsync, deleteAsync, writeAsStringAsync, cacheDirectory, EncodingType } from 'expo-file-system/legacy';
import { chatService } from '../services/chatService';
import type {
  ChatMode,
  ChatMessage,
  ConversationSummary,
} from '../types/chat';

const MAX_DURATION_SECONDS = 120;

interface UseChatState {
  // Connection state
  isConnected: boolean;
  conversationId: string | null;

  // Recording state
  isRecording: boolean;
  isProcessing: boolean;

  // Conversation state
  messages: ChatMessage[];

  // Timer
  remainingSeconds: number;

  // Results
  summary: ConversationSummary | null;

  // Error
  error: string | null;
}

interface UseChatReturn extends UseChatState {
  startChat: (mode?: ChatMode) => Promise<void>;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  endChat: () => Promise<void>;
  playAudio: (audioBase64: string) => Promise<void>;
  resetChat: () => void;
}

/**
 * Hook for managing voice chat with AI
 * Handles recording, WebSocket communication, and audio playback
 */
export function useChat(): UseChatReturn {
  const [state, setState] = useState<UseChatState>({
    isConnected: false,
    conversationId: null,
    isRecording: false,
    isProcessing: false,
    messages: [],
    remainingSeconds: MAX_DURATION_SECONDS,
    summary: null,
    error: null,
  });

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const conversationIdRef = useRef<string | null>(null);

  // ============================================================
  // CLEANUP
  // ============================================================

  useEffect(() => {
    return () => {
      // Clean up on unmount
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
      chatService.disconnect();
    };
  }, []);

  // ============================================================
  // START CHAT
  // ============================================================

  const startChat = useCallback(async (mode: ChatMode = 'free_talk') => {
    try {
      setState((s) => ({ ...s, error: null, isProcessing: true }));

      // Request microphone permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setState((s) => ({
          ...s,
          error: 'Microphone permission required',
          isProcessing: false,
        }));
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Connect to WebSocket
      await chatService.connect();

      // Set up event handlers
      chatService.onStarted((response) => {
        conversationIdRef.current = response.conversationId;

        const greetingMessage: ChatMessage = {
          id: 'greeting-' + Date.now(),
          conversationId: response.conversationId,
          role: 'assistant',
          content: response.greeting.text,
          timestamp: Date.now(),
        };

        setState((s) => ({
          ...s,
          isConnected: true,
          conversationId: response.conversationId,
          messages: [greetingMessage],
          isProcessing: false,
          remainingSeconds: MAX_DURATION_SECONDS,
        }));

        // Play greeting audio
        playAudioInternal(response.greeting.audioBase64);

        // Start countdown timer
        timerRef.current = setInterval(() => {
          setState((s) => {
            if (s.remainingSeconds <= 1) {
              // Auto-end when time runs out
              if (conversationIdRef.current) {
                endChatInternal(conversationIdRef.current);
              }
              return { ...s, remainingSeconds: 0 };
            }
            return { ...s, remainingSeconds: s.remainingSeconds - 1 };
          });
        }, 1000);
      });

      chatService.onProcessing(() => {
        setState((s) => ({ ...s, isProcessing: true }));
      });

      chatService.onTurn((response) => {
        setState((s) => ({
          ...s,
          messages: [...s.messages, response.userMessage, response.assistantMessage],
          isProcessing: false,
        }));

        // Play AI response audio
        playAudioInternal(response.audioBase64);
      });

      chatService.onGeneratingSummary(() => {
        setState((s) => ({ ...s, isProcessing: true }));
      });

      chatService.onSummary((response) => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setState((s) => ({
          ...s,
          summary: response.summary,
          isProcessing: false,
        }));
      });

      chatService.onError((error) => {
        // Make error messages more user-friendly
        let userMessage = error.message;
        if (error.message.includes('No speech could be recognized') || error.code === 'NO_SPEECH') {
          userMessage = "I couldn't hear you. Please hold the button and speak clearly.";
        } else if (error.message.includes('connection') || error.code === 'CONNECTION_ERROR') {
          userMessage = 'Connection lost. Please try again.';
        }

        setState((s) => ({
          ...s,
          error: userMessage,
          isProcessing: false,
        }));
      });

      // Start the conversation
      chatService.startChat(mode);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to start chat';
      setState((s) => ({
        ...s,
        error: message,
        isProcessing: false,
      }));
    }
  }, []);

  // ============================================================
  // RECORDING
  // ============================================================

  const startRecording = useCallback(async () => {
    if (!state.conversationId || state.isRecording) {
      return;
    }

    try {
      // Stop any playing audio first
      if (soundRef.current) {
        await soundRef.current.stopAsync().catch(() => {});
      }

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

      setState((s) => ({ ...s, isRecording: true }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to start recording';
      setState((s) => ({ ...s, error: message }));
    }
  }, [state.conversationId, state.isRecording]);

  const stopRecording = useCallback(async () => {
    if (!recordingRef.current || !state.conversationId) {
      return;
    }

    try {
      setState((s) => ({ ...s, isRecording: false, isProcessing: true }));

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) {
        setState((s) => ({ ...s, error: 'No recording found', isProcessing: false }));
        return;
      }

      // Convert to base64
      const base64 = await readAsStringAsync(uri, {
        encoding: EncodingType.Base64,
      });

      // Clean up file
      await deleteAsync(uri, { idempotent: true });

      // Send to backend
      chatService.sendAudio(state.conversationId, base64);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to process recording';
      setState((s) => ({
        ...s,
        error: message,
        isProcessing: false,
      }));
    }
  }, [state.conversationId]);

  // ============================================================
  // END CHAT
  // ============================================================

  const endChat = useCallback(async () => {
    if (!state.conversationId) {
      return;
    }
    endChatInternal(state.conversationId);
  }, [state.conversationId]);

  const endChatInternal = (conversationId: string) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setState((s) => ({ ...s, isProcessing: true }));
    chatService.endChat(conversationId);
  };

  // ============================================================
  // AUDIO PLAYBACK
  // ============================================================

  const playAudio = useCallback(async (audioBase64: string) => {
    await playAudioInternal(audioBase64);
  }, []);

  const playAudioInternal = async (audioBase64: string) => {
    try {
      // Unload previous sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // Write to temp file
      const fileUri = `${cacheDirectory}ai_response_${Date.now()}.mp3`;
      await writeAsStringAsync(fileUri, audioBase64, {
        encoding: EncodingType.Base64,
      });

      // Play
      const { sound } = await Audio.Sound.createAsync({ uri: fileUri });
      soundRef.current = sound;
      await sound.playAsync();

      // Cleanup after playback
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          deleteAsync(fileUri, { idempotent: true }).catch(() => {});
          if (soundRef.current === sound) {
            soundRef.current = null;
          }
        }
      });
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  };

  // ============================================================
  // RESET
  // ============================================================

  const resetChat = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync().catch(() => {});
      recordingRef.current = null;
    }
    if (soundRef.current) {
      soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    chatService.disconnect();
    conversationIdRef.current = null;

    setState({
      isConnected: false,
      conversationId: null,
      isRecording: false,
      isProcessing: false,
      messages: [],
      remainingSeconds: MAX_DURATION_SECONDS,
      summary: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    startChat,
    startRecording,
    stopRecording,
    endChat,
    playAudio,
    resetChat,
  };
}
