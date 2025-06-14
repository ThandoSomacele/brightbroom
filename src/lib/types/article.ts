// src/lib/types/article.ts

/**
 * Article categories for content organisation
 */
export type ArticleCategory =
  | "small-spaces"
  | "organisation"
  | "design-tips"
  | "lifestyle"
  | "maintenance"
  | "apartment-living";

/**
 * South African service areas for article tagging
 */
export type ServiceArea =
  | "fourways"
  | "bryanston"
  | "randburg"
  | "midrand"
  | "north-riding"
  | "cosmo-city"
  | "roodepoort"
  | "honeydew"
  | "cape-town"
  | "johannesburg";

/**
 * Call-to-action configuration for articles
 */
export interface ArticleCTA {
  text: string;
  href: string;
  type: "primary" | "secondary";
  position: "inline" | "end";
}

/**
 * Article frontmatter structure
 */
export interface ArticleFrontmatter {
  title: string;
  description: string;
  author: {
    name: string;
    bio: string;
    avatar?: string;
  };
  publishedAt: string;
  updatedAt?: string;
  featuredImage: string;
  imageAlt: string;
  category: ArticleCategory;
  serviceAreas: ServiceArea[];
  tags: string[];
  readingTime: number; // in minutes
  draft: boolean;
  seo: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  ctas: ArticleCTA[];
}

/**
 * Complete article data including content
 */
export interface Article {
  slug: string;
  frontmatter: ArticleFrontmatter;
  content: string;
  excerpt: string;
}

/**
 * Article summary for listing pages
 */
export interface ArticleSummary {
  slug: string;
  title: string;
  description: string;
  featuredImage: string;
  imageAlt: string;
  category: ArticleCategory;
  serviceAreas: ServiceArea[];
  tags: string[];
  readingTime: number;
  publishedAt: string;
  author: {
    name: string;
    avatar?: string;
  };
}
