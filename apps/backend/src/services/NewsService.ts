import OpenAI from 'openai';
import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '../shared/utils/logger.js';

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  fullContent: string;
  source: string;
  sourceUrl: string;
  category: 'ai' | 'tech' | 'startup' | 'influencer';
  publishedAt: string;
  estimatedReadTime: number;
  wordCount: number;
  audioGenerated?: boolean;
}

interface NewsCache {
  articles: NewsArticle[];
  lastUpdated: string;
  expiresAt: string;
}

interface NewsServiceConfig {
  openaiApiKey: string;
  openaiModel?: string;
  cacheDir?: string;
  cacheTTLHours?: number;
}

// WebSearchResult interface for future web search API integration
// interface WebSearchResult {
//   title: string;
//   url: string;
//   snippet: string;
// }

/**
 * News Service for fetching and summarizing tech/AI news
 * Uses OpenAI for web search and summarization
 */
export class NewsService {
  private openai: OpenAI;
  private cacheDir: string;
  private cacheTTLHours: number;
  private cacheFilePath: string;

  constructor(config: NewsServiceConfig) {
    this.openai = new OpenAI({ apiKey: config.openaiApiKey });
    // Use process.cwd() for ESM compatibility - assumes running from apps/backend
    this.cacheDir = config.cacheDir || path.join(process.cwd(), 'data');
    this.cacheTTLHours = config.cacheTTLHours || 24;
    this.cacheFilePath = path.join(this.cacheDir, 'news-cache.json');
  }

  /**
   * Get daily news articles
   * Returns cached articles if still valid, otherwise fetches fresh
   */
  async getDailyNews(): Promise<NewsArticle[]> {
    // Try to load from cache
    const cached = await this.loadCache();
    if (cached && new Date(cached.expiresAt) > new Date()) {
      logger.info('Returning cached news articles', { count: cached.articles.length });
      return cached.articles;
    }

    // Fetch fresh news
    logger.info('Cache expired or not found, fetching fresh news');
    return this.refreshNews();
  }

  /**
   * Force refresh news from sources
   */
  async refreshNews(): Promise<NewsArticle[]> {
    try {
      // Use OpenAI to search and summarize news
      const articles = await this.fetchAndSummarizeNews();

      // Save to cache
      await this.saveCache(articles);

      return articles;
    } catch (error) {
      logger.error('Failed to refresh news', { error });

      // Return cached articles even if expired, as fallback
      const cached = await this.loadCache();
      if (cached) {
        logger.info('Returning stale cache as fallback');
        return cached.articles;
      }

      return [];
    }
  }

  /**
   * Get a single article by ID
   */
  async getArticleById(id: string): Promise<NewsArticle | null> {
    const articles = await this.getDailyNews();
    return articles.find(a => a.id === id) || null;
  }

  /**
   * Fetch news using OpenAI's capabilities with web search
   */
  private async fetchAndSummarizeNews(): Promise<NewsArticle[]> {
    const today = new Date().toISOString().split('T')[0];

    const userPrompt = `Search for the latest AI and technology news from the LAST 24 HOURS (today is ${today}).

Find 10 real news articles from these sources:
- Tech news: TechCrunch, The Verge, Wired, Ars Technica, CNET
- Business/Tech: Bloomberg Technology, Reuters Tech, CNBC Tech
- Social media announcements: Twitter/X, LinkedIn, YouTube official blogs
- Big tech companies: OpenAI, Anthropic, Google, Meta, Microsoft, Apple, Amazon, Tesla, NVIDIA
- AI researchers and influencers on Twitter/X

For EACH news item found, provide:
1. The actual headline from the source
2. A summary of exactly 140-160 words (optimized for 1-minute reading at ~150 WPM)
3. The real source name and actual URL
4. Category: ai, tech, startup, or influencer

Return as JSON with this exact structure:
{
  "articles": [
    {
      "title": "Actual Headline from Source",
      "summary": "140-160 word summary written for 1-minute read-aloud practice. Clear sentences, good for pronunciation practice.",
      "source": "Actual Source Name",
      "sourceUrl": "https://actual-url.com/article",
      "category": "ai|tech|startup|influencer"
    }
  ]
}

IMPORTANT:
- Only include REAL news from the last 24 hours
- Use actual URLs that exist
- Make summaries engaging and suitable for English learners to read aloud
- Use clear, professional language without jargon`;

    try {
      // Use web search enabled model for real-time news
      const response = await this.openai.responses.create({
        model: 'gpt-4o',
        tools: [{ type: 'web_search_preview' }],
        input: userPrompt,
      });

      // Extract text content from the response
      let content = '';
      for (const item of response.output) {
        if (item.type === 'message') {
          for (const block of item.content) {
            if (block.type === 'output_text') {
              content += block.text;
            }
          }
        }
      }

      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      logger.info('OpenAI web search response received', { contentLength: content.length });

      // Extract JSON from the response (may be wrapped in markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*"articles"[\s\S]*\}/);
      if (!jsonMatch) {
        logger.error('No JSON found in OpenAI response', { content: content.substring(0, 500) });
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const articles: NewsArticle[] = (parsed.articles || []).map((article: {
        title: string;
        summary: string;
        source: string;
        sourceUrl: string;
        category: string;
      }, index: number) => {
        const wordCount = article.summary.split(/\s+/).length;
        return {
          id: `news-${Date.now()}-${index}`,
          title: article.title,
          summary: article.summary,
          fullContent: article.summary, // Same as summary for now
          source: article.source,
          sourceUrl: article.sourceUrl,
          category: article.category as NewsArticle['category'],
          publishedAt: new Date().toISOString(),
          estimatedReadTime: 60, // 1 minute
          wordCount,
          audioGenerated: false,
        };
      });

      logger.info('Fetched and summarized news articles', { count: articles.length });
      return articles;
    } catch (error) {
      logger.error('Failed to fetch news from OpenAI', {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : 'Unknown',
      });
      throw error;
    }
  }

  /**
   * Load cache from disk
   */
  private async loadCache(): Promise<NewsCache | null> {
    try {
      const data = await fs.readFile(this.cacheFilePath, 'utf-8');
      return JSON.parse(data) as NewsCache;
    } catch {
      return null;
    }
  }

  /**
   * Save cache to disk
   */
  private async saveCache(articles: NewsArticle[]): Promise<void> {
    try {
      // Ensure cache directory exists
      await fs.mkdir(this.cacheDir, { recursive: true });

      const cache: NewsCache = {
        articles,
        lastUpdated: new Date().toISOString(),
        expiresAt: new Date(Date.now() + this.cacheTTLHours * 60 * 60 * 1000).toISOString(),
      };

      await fs.writeFile(this.cacheFilePath, JSON.stringify(cache, null, 2));
      logger.info('Saved news cache', { count: articles.length });
    } catch (error) {
      logger.error('Failed to save news cache', { error });
    }
  }

  /**
   * Mark article as having generated audio
   */
  async markAudioGenerated(articleId: string): Promise<void> {
    const cached = await this.loadCache();
    if (cached) {
      const article = cached.articles.find(a => a.id === articleId);
      if (article) {
        article.audioGenerated = true;
        await this.saveCache(cached.articles);
      }
    }
  }
}
