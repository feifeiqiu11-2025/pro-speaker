import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useChat } from '../hooks/useChat';
import type { ChatMode, ChatMessage } from '../types/chat';

// Theme colors matching web app
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

export default function ChatScreen() {
  const navigation = useNavigation<any>();
  const scrollViewRef = useRef<ScrollView>(null);
  const [chatStarted, setChatStarted] = useState(false);

  const {
    isConnected,
    conversationId,
    isRecording,
    isProcessing,
    messages,
    remainingSeconds,
    summary,
    error,
    startChat,
    startRecording,
    stopRecording,
    endChat,
    resetChat,
  } = useChat();

  // Navigate to summary when ready
  useEffect(() => {
    if (summary) {
      navigation.navigate('ChatSummary', { summary });
    }
  }, [summary, navigation]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGoHome = () => {
    if (chatStarted && conversationId) {
      // End chat before going home
      endChat();
    }
    resetChat();
    setChatStarted(false);
    navigation.navigate('Home');
  };

  const handleStartChat = async (mode: ChatMode = 'free_talk') => {
    setChatStarted(true);
    await startChat(mode);
  };

  const handleEndChat = () => {
    endChat();
  };

  const handleResetAndTryAgain = () => {
    resetChat();
    setChatStarted(false);
  };

  // ============================================================
  // IDLE STATE - Not started
  // ============================================================
  if (!chatStarted) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={handleGoHome} style={styles.homeButton}>
                <Text style={styles.homeIcon}>☰</Text>
              </TouchableOpacity>
              <Text style={styles.title}>AI Chat Coach</Text>
              <View style={styles.headerSpacer} />
            </View>
            <Text style={styles.subtitle}>Practice natural conversation</Text>
          </View>

          {/* Intro */}
          <View style={styles.introCard}>
            <Text style={styles.introText}>
              Have a free-form conversation with your AI coach. Practice speaking
              naturally while getting real-time feedback on pronunciation and
              communication style.
            </Text>
          </View>

          {/* Mode Selection */}
          <View style={styles.modeSection}>
            <Text style={styles.sectionLabel}>Choose a mode:</Text>

            <TouchableOpacity
              style={styles.modeButton}
              onPress={() => handleStartChat('free_talk')}
              activeOpacity={0.7}
            >
              <View style={styles.modeIconContainer}>
                <Text style={styles.modeEmoji}>💬</Text>
              </View>
              <View style={styles.modeTextContainer}>
                <Text style={styles.modeTitle}>Free Talk</Text>
                <Text style={styles.modeDescription}>
                  Talk about anything on your mind
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modeButton}
              onPress={() => handleStartChat('reflective')}
              activeOpacity={0.7}
            >
              <View style={styles.modeIconContainer}>
                <Text style={styles.modeEmoji}>🧠</Text>
              </View>
              <View style={styles.modeTextContainer}>
                <Text style={styles.modeTitle}>Think Out Loud</Text>
                <Text style={styles.modeDescription}>
                  Work through a decision or idea
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modeButton}
              onPress={() => handleStartChat('professional')}
              activeOpacity={0.7}
            >
              <View style={styles.modeIconContainer}>
                <Text style={styles.modeEmoji}>💼</Text>
              </View>
              <View style={styles.modeTextContainer}>
                <Text style={styles.modeTitle}>Professional</Text>
                <Text style={styles.modeDescription}>
                  Practice workplace communication
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* How it works */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>How it works:</Text>
            <Text style={styles.tipItem}>• Hold the button to speak</Text>
            <Text style={styles.tipItem}>• Release to hear AI respond</Text>
            <Text style={styles.tipItem}>• 2 minute conversation limit</Text>
            <Text style={styles.tipItem}>• Get a full summary at the end</Text>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ============================================================
  // ACTIVE CHAT STATE
  // ============================================================
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Chat Header */}
      <View style={styles.chatHeader}>
        <Text
          style={[
            styles.timer,
            remainingSeconds <= 30 && styles.timerWarning,
          ]}
        >
          {formatTime(remainingSeconds)}
        </Text>
        <TouchableOpacity
          style={styles.endButton}
          onPress={handleEndChat}
          disabled={isProcessing}
        >
          <Text style={styles.endButtonText}>End Chat</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message, index) => (
          <MessageBubble key={message.id || index} message={message} />
        ))}

        {/* Processing indicator */}
        {isProcessing && (
          <View style={[styles.messageBubble, styles.assistantBubble]}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.processingText}>
              {messages.length <= 1 ? 'Connecting...' : 'AI is thinking...'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Error display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleResetAndTryAgain}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Hold to talk button */}
      <View style={styles.bottomContainer}>
        <Pressable
          style={[
            styles.talkButton,
            isRecording && styles.talkButtonActive,
            (isProcessing || !isConnected) && styles.talkButtonDisabled,
          ]}
          onPressIn={startRecording}
          onPressOut={stopRecording}
          disabled={isProcessing || !isConnected}
        >
          <Text style={styles.talkButtonIcon}>
            {isRecording ? '🔴' : '🎙️'}
          </Text>
          <Text style={styles.talkButtonText}>
            {isRecording
              ? 'Release to send'
              : isProcessing
              ? 'AI responding...'
              : !isConnected
              ? 'Connecting...'
              : 'Hold to speak'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ============================================================
// MESSAGE BUBBLE COMPONENT
// ============================================================

interface MessageBubbleProps {
  message: ChatMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <View
      style={[
        styles.messageBubble,
        isUser ? styles.userBubble : styles.assistantBubble,
      ]}
    >
      <Text
        style={[
          styles.messageText,
          isUser ? styles.userText : styles.assistantText,
        ]}
      >
        {message.content}
      </Text>

      {/* Show mispronounced words for user messages */}
      {isUser && message.pronunciation?.mispronounced && message.pronunciation.mispronounced.length > 0 && (
        <View style={styles.pronunciationHint}>
          {message.pronunciation.mispronounced.slice(0, 2).map((word, i) => (
            <Text key={i} style={styles.pronunciationText}>
              "{word.word}" → {word.suggestion}
            </Text>
          ))}
        </View>
      )}

      {/* Show inline coaching for assistant messages */}
      {!isUser && message.inlineCoaching && (
        <View style={styles.coachingHint}>
          <Text style={styles.coachingText}>
            💡 {message.inlineCoaching.tip}
          </Text>
        </View>
      )}
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
  introCard: {
    backgroundColor: COLORS.backgroundSecondary,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  introText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  modeSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  modeEmoji: {
    fontSize: 24,
  },
  modeTextContainer: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  modeDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  tipsCard: {
    backgroundColor: COLORS.backgroundSecondary,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  tipItem: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  bottomPadding: {
    height: 100,
  },

  // Active chat styles
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  timer: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  timerWarning: {
    color: COLORS.warning,
  },
  endButton: {
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  endButtonText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 14,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 18,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.backgroundSecondary,
    borderBottomLeftRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: COLORS.text,
  },
  assistantText: {
    color: COLORS.text,
  },
  pronunciationHint: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  pronunciationText: {
    fontSize: 12,
    color: COLORS.warning,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  coachingHint: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  coachingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  processingText: {
    marginLeft: 10,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: COLORS.error,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: COLORS.text,
    fontSize: 14,
    flex: 1,
  },
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 10,
  },
  retryButtonText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  talkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 20,
    borderRadius: 16,
  },
  talkButtonActive: {
    backgroundColor: COLORS.error,
  },
  talkButtonDisabled: {
    backgroundColor: COLORS.backgroundSecondary,
    opacity: 0.7,
  },
  talkButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  talkButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
});
