// src/routes/magazine/+page.server.ts
import { ArticleService } from "$lib/services/article.service";
import type { PageServerLoad } from "./$types";

// Helper function to fetch articles data
async function getArticlesData(category: string | null, area: string | null, search: string | null) {
  // Load articles based on filters
  let articles;
  if (search) {
    articles = await ArticleService.searchArticles(search);
  } else if (category) {
    articles = await ArticleService.getArticlesByCategory(category as any);
  } else if (area) {
    articles = await ArticleService.getArticlesByServiceArea(area as any);
  } else {
    articles = await ArticleService.getAllArticles();
  }

  // Get featured articles for hero section
  const featuredArticles = await ArticleService.getFeaturedArticles(3);

  return {
    articles,
    featuredArticles,
  };
}

export const load: PageServerLoad = async ({ url }) => {
  // Get query parameters for filtering
  const category = url.searchParams.get("category");
  const area = url.searchParams.get("area");
  const search = url.searchParams.get("search");

  // Get filter options (these are small and fast, no need to stream)
  let categories: string[] = [];
  let serviceAreas: string[] = [];

  try {
    [categories, serviceAreas] = await Promise.all([
      ArticleService.getCategories(),
      ArticleService.getServiceAreas(),
    ]);
  } catch (error) {
    console.error("Error loading filter options:", error);
  }

  return {
    categories,
    serviceAreas,
    filters: {
      category,
      area,
      search,
    },
    meta: {
      title: "Magazine",
      description:
        "Discover home organisation, cleaning tips, and lifestyle content for small spaces in South Africa.",
    },
    streamed: {
      articlesData: getArticlesData(category, area, search),
    },
  };
};
