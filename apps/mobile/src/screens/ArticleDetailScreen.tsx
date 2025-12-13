import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ListenReadStackParamList } from '../types';
import { API_URL } from '../config/constants';

interface WordBoundary {
  word: string;
  offset: number;
  duration: number;
}

type Props = NativeStackScreenProps<ListenReadStackParamList, 'ArticleDetail'>;

// Theme colors matching web app
const COLORS = {
  background: '#0F172A',
  backgroundSecondary: '#1E293B',
  primary: '#3B82F6',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: '#334155',
  success: '#10B981',
};

type PracticeMode = 'listen' | 'read';

export default function ArticleDetailScreen({ navigation, route }: Props) {
  const { article } = route.params;
  const [selectedMode, setSelectedMode] = useState<PracticeMode>('listen');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [wordBoundaries, setWordBoundaries] = useState<WordBoundary[]>([]);

  const soundRef = useRef<Audio.Sound | null>(null);
  const playbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playbackStartTimeRef = useRef<number>(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, []);

  // Fetch word boundaries for sync
  const fetchWordBoundaries = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/news/${article.id}/boundaries`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.boundaries) {
          setWordBoundaries(data.data.boundaries);
        }
      }
    } catch (err) {
      console.log('Could not fetch word boundaries:', err);
    }
  }, [article.id]);

  // Track playback position and highlight words
  const startWordTracking = useCallback(() => {
    if (wordBoundaries.length === 0) return;

    playbackStartTimeRef.current = Date.now();

    playbackIntervalRef.current = setInterval(async () => {
      if (!soundRef.current) return;

      try {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          const currentMs = status.positionMillis;

          // Find current word based on position
          const wordIndex = wordBoundaries.findIndex((boundary, idx) => {
            const nextBoundary = wordBoundaries[idx + 1];
            const endOffset = nextBoundary ? nextBoundary.offset : boundary.offset + boundary.duration;
            return currentMs >= boundary.offset && currentMs < endOffset;
          });

          if (wordIndex !== -1 && wordIndex !== currentWordIndex) {
            setCurrentWordIndex(wordIndex);
          }
        }
      } catch (err) {
        // Ignore errors during status check
      }
    }, 50); // 50ms polling like web version
  }, [wordBoundaries, currentWordIndex]);

  const stopWordTracking = useCallback(() => {
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
    setCurrentWordIndex(-1);
  }, []);

  const handlePlayPause = useCallback(async () => {
    if (isPlaying) {
      // Pause playback
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
      }
      stopWordTracking();
      setIsPlaying(false);
    } else {
      // Start or resume playback
      setIsLoading(true);

      try {
        // Fetch word boundaries if not already fetched
        if (wordBoundaries.length === 0) {
          await fetchWordBoundaries();
        }

        if (!soundRef.current) {
          // Configure audio mode for playback
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
          });

          // Create and load audio from backend
          const { sound } = await Audio.Sound.createAsync(
            { uri: `${API_URL}/api/news/${article.id}/audio` },
            { shouldPlay: true },
            (status) => {
              if (status.isLoaded && status.didJustFinish) {
                setIsPlaying(false);
                stopWordTracking();
                setCurrentWordIndex(-1);
              }
            }
          );
          soundRef.current = sound;
        } else {
          // Resume existing sound
          await soundRef.current.playAsync();
        }

        setIsPlaying(true);
        startWordTracking();
      } catch (err) {
        console.error('Error playing audio:', err);
      } finally {
        setIsLoading(false);
      }
    }
  }, [isPlaying, article.id, wordBoundaries.length, fetchWordBoundaries, startWordTracking, stopWordTracking]);

  const handleBack = () => {
    // Stop audio when leaving
    if (soundRef.current) {
      soundRef.current.stopAsync();
      soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    stopWordTracking();
    navigation.goBack();
  };

  const handleStartPractice = () => {
    if (selectedMode === 'listen') {
      handlePlayPause();
    } else {
      // Navigate to recording with read_aloud mode
      navigation.navigate('Recording', {
        mode: 'read_aloud',
        prompt: {
          id: article.id,
          mode: 'read_aloud',
          title: article.title,
          prompt: article.content,
          hints: ['Read clearly and at a steady pace', 'Focus on pronunciation', 'Try to match natural intonation'],
          category: article.category,
        },
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Article</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Article Image */}
        {article.image_url && (
          <Image
            source={{ uri: article.image_url }}
            style={styles.articleImage}
            resizeMode="cover"
          />
        )}

        {/* Article Meta */}
        <View style={styles.articleMeta}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{article.category}</Text>
          </View>
          <Text style={styles.readingTime}>
            {article.reading_time_minutes} min read
          </Text>
        </View>

        {/* Article Title */}
        <Text style={styles.articleTitle}>{article.title}</Text>

        {/* Article Info */}
        <View style={styles.articleInfo}>
          <Text style={styles.articleSource}>{article.source}</Text>
          <Text style={styles.articleDot}>•</Text>
          <Text style={styles.articleDate}>{formatDate(article.published_at)}</Text>
        </View>

        {/* Mode Selector */}
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              selectedMode === 'listen' && styles.modeButtonActive,
            ]}
            onPress={() => setSelectedMode('listen')}
          >
            <Text style={styles.modeButtonIcon}>🎧</Text>
            <Text
              style={[
                styles.modeButtonText,
                selectedMode === 'listen' && styles.modeButtonTextActive,
              ]}
            >
              Listen
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeButton,
              selectedMode === 'read' && styles.modeButtonActive,
            ]}
            onPress={() => setSelectedMode('read')}
          >
            <Text style={styles.modeButtonIcon}>📖</Text>
            <Text
              style={[
                styles.modeButtonText,
                selectedMode === 'read' && styles.modeButtonTextActive,
              ]}
            >
              Read Aloud
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mode Description - Only show for Read Aloud mode */}
        {selectedMode === 'read' && (
          <View style={styles.modeDescription}>
            <Text style={styles.modeDescTitle}>Read Aloud Mode</Text>
            <Text style={styles.modeDescText}>
              Read the article out loud and get AI feedback on your pronunciation,
              pace, and fluency. Perfect for speaking practice!
            </Text>
          </View>
        )}

        {/* Article Content Preview with Word Highlighting */}
        <View style={styles.contentPreview}>
          <Text style={styles.contentPreviewTitle}>
            {selectedMode === 'listen' && isPlaying ? 'Now Playing' : 'Article Preview'}
          </Text>
          {wordBoundaries.length > 0 && selectedMode === 'listen' ? (
            <Text style={styles.contentText}>
              {wordBoundaries.map((boundary, index) => (
                <Text
                  key={index}
                  style={[
                    styles.word,
                    index === currentWordIndex && styles.highlightedWord,
                  ]}
                >
                  {boundary.word}{' '}
                </Text>
              ))}
            </Text>
          ) : (
            <Text style={styles.contentText}>
              {article.content || article.summary}
            </Text>
          )}
        </View>

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Start Practice Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.startButton, isLoading && styles.startButtonDisabled]}
          onPress={handleStartPractice}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.text} style={{ marginRight: 10 }} />
          ) : (
            <Text style={styles.startButtonIcon}>
              {selectedMode === 'listen' ? (isPlaying ? '⏸' : '▶') : '🎙️'}
            </Text>
          )}
          <Text style={styles.startButtonText}>
            {isLoading
              ? 'Loading...'
              : selectedMode === 'listen'
              ? isPlaying
                ? 'Pause'
                : 'Start Listening'
              : 'Start Reading Aloud'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: COLORS.text,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  articleImage: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.border,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 12,
  },
  categoryText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  readingTime: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  articleTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 32,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  articleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  articleSource: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  articleDot: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginHorizontal: 8,
  },
  articleDate: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  modeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  modeButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  modeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modeButtonTextActive: {
    color: COLORS.primary,
  },
  modeDescription: {
    backgroundColor: COLORS.backgroundSecondary,
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  modeDescTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  modeDescText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  contentPreview: {
    paddingHorizontal: 20,
  },
  contentPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  contentText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 26,
  },
  word: {
    color: COLORS.textSecondary,
  },
  highlightedWord: {
    color: COLORS.primary,
    fontWeight: '600',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 4,
  },
  bottomPadding: {
    height: 120,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
  },
  startButtonDisabled: {
    opacity: 0.7,
  },
  startButtonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
  },
});
