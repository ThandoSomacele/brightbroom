// src/lib/services/article.service.ts
import type { Article, ArticleSummary, ArticleCategory, ServiceArea } from '$lib/types/article';
import { parseMarkdownFile, articleToSummary } from '$lib/utils/markdown';

/**
 * Article service for managing markdown-based articles
 * This service is designed to run only on the server side
 */
export class ArticleService {
  private static articleCache: Map<string, Article> = new Map();
  private static summaryCache: ArticleSummary[] | null = null;

  /**
   * Load all article files from the content directory
   * Server-side only using Vite's import.meta.glob
   */
  private static async loadArticleFiles(): Promise<Record<string, string>> {
    try {
      // Import all markdown files from the articles directory
      const modules = import.meta.glob('/src/content/articles/*.md', {
        query: '?raw',
        import: 'default',
        eager: false
      });

      const articles: Record<string, string> = {};
      
      for (const [path, moduleFunction] of Object.entries(modules)) {
        const filename = path.split('/').pop()!;
        const content = await moduleFunction() as string;
        articles[filename] = content;
      }

      return articles;
    } catch (error) {
      console.error('Error loading article files:', error);
      return {};
    }
  }

  /**
   * Get all published articles as summaries
   */
  static async getAllArticles(): Promise<ArticleSummary[]> {
    // Return cached results if available
    if (this.summaryCache) {
      return this.summaryCache;
    }

    try {
      const articleFiles = await this.loadArticleFiles();
      const articles: ArticleSummary[] = [];

      for (const [filename, content] of Object.entries(articleFiles)) {
        try {
          const article = parseMarkdownFile(content, filename);
          
          // Only include published articles
          if (!article.frontmatter.draft) {
            articles.push(articleToSummary(article));
          }
        } catch (error) {
          console.error(`Error parsing article ${filename}:`, error);
          // Continue processing other articles
        }
      }

      // Sort by publication date (newest first)
      articles.sort((a, b) => 
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );

      // Cache the results
      this.summaryCache = articles;
      return articles;
    } catch (error) {
      console.error('Error getting all articles:', error);
      return [];
    }
  }

  /**
   * Get a specific article by slug
   */
  static async getArticleBySlug(slug: string): Promise<Article | null> {
    // Check cache first
    if (this.articleCache.has(slug)) {
      return this.articleCache.get(slug)!;
    }

    try {
      const articleFiles = await this.loadArticleFiles();
      const filename = `${slug}.md`;
      
      if (!articleFiles[filename]) {
        return null;
      }

      const article = parseMarkdownFile(articleFiles[filename], filename);
      
      // Don't return draft articles in production
      if (article.frontmatter.draft && import.meta.env.PROD) {
        return null;
      }

      // Cache the result
      this.articleCache.set(slug, article);
      return article;
    } catch (error) {
      console.error(`Error getting article ${slug}:`, error);
      return null;
    }
  }

  /**
   * Get articles filtered by category
   */
  static async getArticlesByCategory(category: ArticleCategory): Promise<ArticleSummary[]> {
    const allArticles = await this.getAllArticles();
    return allArticles.filter(article => article.category === category);
  }

  /**
   * Get articles filtered by service area
   */
  static async getArticlesByServiceArea(area: ServiceArea): Promise<ArticleSummary[]> {
    const allArticles = await this.getAllArticles();
    return allArticles.filter(article => 
      article.serviceAreas.includes(area)
    );
  }

  /**
   * Get featured articles
   */
  static async getFeaturedArticles(limit: number = 3): Promise<ArticleSummary[]> {
    const allArticles = await this.getAllArticles();
    return allArticles.slice(0, limit);
  }

  /**
   * Get related articles based on tags and category
   */
  static async getRelatedArticles(
    currentSlug: string, 
    category: ArticleCategory, 
    tags: string[], 
    limit: number = 3
  ): Promise<ArticleSummary[]> {
    const allArticles = await this.getAllArticles();
    
    // Exclude the current article
    const otherArticles = allArticles.filter(article => article.slug !== currentSlug);
    
    // Score articles based on relevance
    const scored = otherArticles.map(article => {
      let score = 0;
      
      // Same category gets higher score
      if (article.category === category) {
        score += 10;
      }
      
      // Shared tags increase score
      const sharedTags = article.tags.filter(tag => tags.includes(tag));
      score += sharedTags.length * 5;
      
      return { article, score };
    });
    
    // Sort by score and return top results
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.article);
  }

  /**
   * Search articles
   */
  static async searchArticles(query: string): Promise<ArticleSummary[]> {
    if (!query.trim()) {
      return [];
    }

    const allArticles = await this.getAllArticles();
    const searchTerm = query.toLowerCase();
    
    return allArticles.filter(article => 
      article.title.toLowerCase().includes(searchTerm) ||
      article.description.toLowerCase().includes(searchTerm) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Clear cache (useful for development)
   */
  static clearCache(): void {
    this.articleCache.clear();
    this.summaryCache = null;
  }

  /**
   * Get all unique categories from articles
   */
  static async getCategories(): Promise<ArticleCategory[]> {
    const allArticles = await this.getAllArticles();
    const categories = new Set(allArticles.map(article => article.category));
    return Array.from(categories);
  }

  /**
   * Get all unique service areas from articles
   */
  static async getServiceAreas(): Promise<ServiceArea[]> {
    const allArticles = await this.getAllArticles();
    const areas = new Set<ServiceArea>();
    
    allArticles.forEach(article => {
      article.serviceAreas.forEach(area => areas.add(area));
    });
    
    return Array.from(areas);
  }
}
