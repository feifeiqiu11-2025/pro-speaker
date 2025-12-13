import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ListenReadStackParamList } from '../types';
import { API_URL } from '../config/constants';

type Props = NativeStackScreenProps<ListenReadStackParamList, 'ListenReadHome'>;

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

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  source: string;
  category: string;
  published_at: string;
  image_url?: string;
  reading_time_minutes: number;
}

export default function ListenReadScreen({ navigation }: Props) {
  const rootNavigation = useNavigation<any>();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoHome = () => {
    rootNavigation.navigate('Home');
  };

  const fetchNews = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/news`);
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      const result = await response.json();
      // API returns { success: true, data: { articles: [...] } }
      const articlesData = result.data?.articles || result.articles || [];
      // Map backend fields to frontend interface
      const mappedArticles = articlesData.map((article: any) => ({
        id: article.id,
        title: article.title,
        summary: article.summary,
        content: article.content || article.summary,
        source: article.source,
        category: article.category,
        published_at: article.publishedAt || article.published_at,
        image_url: article.image_url,
        reading_time_minutes: article.estimatedReadTime ? Math.ceil(article.estimatedReadTime / 60) : article.reading_time_minutes || 1,
      }));
      setArticles(mappedArticles);
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Unable to load articles. Pull to refresh.');
      // Set sample data for development
      setArticles(SAMPLE_ARTICLES);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const handleArticlePress = (article: NewsArticle) => {
    navigation.navigate('ArticleDetail', { article });
  };

  const onRefresh = () => {
    fetchNews(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading articles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Header with Home Button */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={handleGoHome} style={styles.homeButton}>
              <Text style={styles.homeIcon}>☰</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Listen & Read</Text>
            <View style={styles.headerSpacer} />
          </View>
          <Text style={styles.subtitle}>
            Improve your speaking with AI & tech news
          </Text>
        </View>

        {/* Mode Selector Info */}
        <View style={styles.modeInfo}>
          <View style={styles.modeItem}>
            <Text style={styles.modeIcon}>🎧</Text>
            <View style={styles.modeTextContainer}>
              <Text style={styles.modeTitle}>Listen Mode</Text>
              <Text style={styles.modeDesc}>Hear native pronunciation</Text>
            </View>
          </View>
          <View style={styles.modeDivider} />
          <View style={styles.modeItem}>
            <Text style={styles.modeIcon}>📖</Text>
            <View style={styles.modeTextContainer}>
              <Text style={styles.modeTitle}>Read Aloud</Text>
              <Text style={styles.modeDesc}>Practice speaking</Text>
            </View>
          </View>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Articles List */}
        <View style={styles.articlesContainer}>
          <Text style={styles.sectionTitle}>Today's Articles</Text>

          {articles.map((article) => (
            <TouchableOpacity
              key={article.id}
              style={styles.articleCard}
              onPress={() => handleArticlePress(article)}
              activeOpacity={0.8}
            >
              {article.image_url && (
                <Image
                  source={{ uri: article.image_url }}
                  style={styles.articleImage}
                  resizeMode="cover"
                />
              )}
              <View style={styles.articleContent}>
                <View style={styles.articleMeta}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{article.category}</Text>
                  </View>
                  <Text style={styles.readingTime}>
                    {article.reading_time_minutes} min read
                  </Text>
                </View>
                <Text style={styles.articleTitle} numberOfLines={2}>
                  {article.title}
                </Text>
                <Text style={styles.articleSummary} numberOfLines={2}>
                  {article.summary}
                </Text>
                <View style={styles.articleFooter}>
                  <Text style={styles.articleSource}>{article.source}</Text>
                  <Text style={styles.articleDate}>
                    {formatDate(article.published_at)}
                  </Text>
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

// Sample articles for development/fallback
const SAMPLE_ARTICLES: NewsArticle[] = [
  {
    id: '1',
    title: 'OpenAI Announces GPT-5 with Breakthrough Reasoning Capabilities',
    summary: 'The latest model shows significant improvements in complex reasoning tasks and multi-step problem solving.',
    content: 'OpenAI has announced GPT-5, their most advanced language model yet. The new model demonstrates remarkable improvements in reasoning, coding, and creative tasks...',
    source: 'TechCrunch',
    category: 'AI',
    published_at: new Date().toISOString(),
    reading_time_minutes: 3,
  },
  {
    id: '2',
    title: 'Apple Vision Pro Sales Exceed Expectations in Enterprise Market',
    summary: 'Companies are adopting spatial computing for training, design, and remote collaboration.',
    content: 'Apple\'s Vision Pro headset is finding unexpected success in the enterprise market, with major corporations adopting the device for various use cases...',
    source: 'Bloomberg',
    category: 'Tech',
    published_at: new Date(Date.now() - 3600000).toISOString(),
    reading_time_minutes: 4,
  },
  {
    id: '3',
    title: 'The Rise of AI-Powered Code Assistants in Software Development',
    summary: 'How GitHub Copilot and similar tools are changing the way developers write code.',
    content: 'AI-powered code assistants are revolutionizing software development, with studies showing productivity gains of up to 55% for certain tasks...',
    source: 'Wired',
    category: 'Developer',
    published_at: new Date(Date.now() - 7200000).toISOString(),
    reading_time_minutes: 5,
  },
];

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
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
  modeInfo: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundSecondary,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  modeItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  modeTextContainer: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  modeDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  modeDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 12,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  articlesContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  articleCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  articleImage: {
    width: '100%',
    height: 160,
    backgroundColor: COLORS.border,
  },
  articleContent: {
    padding: 16,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  categoryText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  readingTime: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  articleTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: 8,
  },
  articleSummary: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  articleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  articleSource: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  articleDate: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  bottomPadding: {
    height: 100,
  },
});
