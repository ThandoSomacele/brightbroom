// src/routes/magazine/[slug]/+page.server.ts
import { ArticleService } from "$lib/services/article.service";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, url }) => {
  try {
    const article = await ArticleService.getArticleBySlug(params.slug);

    if (!article) {
      throw error(404, "Article not found");
    }

    // Get related articles
    const relatedArticles = await ArticleService.getRelatedArticles(
      article.slug,
      article.frontmatter.category,
      article.frontmatter.tags,
      3,
    );

    // Create absolute URL for Open Graph image
    const baseUrl = url.origin;
    const ogImage = article.frontmatter.featuredImage.startsWith('http') 
      ? article.frontmatter.featuredImage 
      : `${baseUrl}${article.frontmatter.featuredImage}`;

    return {
      article,
      relatedArticles,
      meta: {
        title: article.frontmatter.seo?.title || article.frontmatter.title,
        description:
          article.frontmatter.seo?.description ||
          article.frontmatter.description,
        keywords: article.frontmatter.seo?.keywords || article.frontmatter.tags,
        ogImage: ogImage,
        url: url.href,
      },
    };
  } catch (err) {
    console.error("Error loading article:", err);

    if (err instanceof Error && "status" in err) {
      throw err; // Re-throw SvelteKit errors
    }

    throw error(500, "Failed to load article");
  }
};
