// src/lib/utils/markdown.ts
import { marked } from 'marked';
import matter from 'gray-matter';
import type { Article, ArticleFrontmatter, ArticleSummary } from '$lib/types/article';

/**
 * Configure marked options for consistent rendering
 */
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert line breaks to <br>
  headerIds: true, // Add IDs to headers for anchor links
});

/**
 * Calculate reading time based on word count
 * Average reading speed: 200 words per minute
 */
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Generate excerpt from content
 */
export function generateExcerpt(content: string, maxLength: number = 160): string {
  // Remove markdown formatting and HTML tags
  const plainText = content
    .replace(/#{1,6}\s+/g, '') // Remove headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
    .replace(/`([^`]+)`/g, '$1') // Remove inline code
    .replace(/\n/g, ' ') // Replace newlines with spaces
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  // Find the last complete sentence within the limit
  const truncated = plainText.substring(0, maxLength);
  const lastSentence = truncated.lastIndexOf('.');
  
  if (lastSentence > maxLength * 0.7) {
    return truncated.substring(0, lastSentence + 1);
  }

  // Fallback to word boundary
  const lastSpace = truncated.lastIndexOf(' ');
  return truncated.substring(0, lastSpace) + '...';
}

/**
 * Create slug from filename
 */
export function createSlugFromFilename(filename: string): string {
  return filename.replace(/\.md$/, '');
}

/**
 * Parse markdown file content
 */
export function parseMarkdownFile(fileContent: string, filename: string): Article {
  const { data, content } = matter(fileContent);
  const frontmatter = data as ArticleFrontmatter;
  
  // Validate required frontmatter fields
  if (!frontmatter.title || !frontmatter.description || !frontmatter.author) {
    throw new Error(`Invalid frontmatter in ${filename}: missing required fields`);
  }

  // Calculate reading time if not provided
  if (!frontmatter.readingTime) {
    frontmatter.readingTime = calculateReadingTime(content);
  }

  const slug = createSlugFromFilename(filename);
  const excerpt = generateExcerpt(content);

  return {
    slug,
    frontmatter,
    content,
    excerpt
  };
}

/**
 * Convert article to summary for listing
 */
export function articleToSummary(article: Article): ArticleSummary {
  return {
    slug: article.slug,
    title: article.frontmatter.title,
    description: article.frontmatter.description,
    featuredImage: article.frontmatter.featuredImage,
    imageAlt: article.frontmatter.imageAlt,
    category: article.frontmatter.category,
    serviceAreas: article.frontmatter.serviceAreas,
    tags: article.frontmatter.tags,
    readingTime: article.frontmatter.readingTime,
    publishedAt: article.frontmatter.publishedAt,
    author: {
      name: article.frontmatter.author.name,
      avatar: article.frontmatter.author.avatar
    }
  };
}

/**
 * Render markdown content to HTML
 */
export function renderMarkdown(content: string): string {
  return marked.parse(content);
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
