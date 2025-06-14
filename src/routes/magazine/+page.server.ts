// src/routes/magazine/+page.server.ts
import { ArticleService } from "$lib/services/article.service";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url }) => {
  try {
    // Get query parameters for filtering
    const category = url.searchParams.get("category");
    const area = url.searchParams.get("area");
    const search = url.searchParams.get("search");

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

    // Get filter options
    const [categories, serviceAreas] = await Promise.all([
      ArticleService.getCategories(),
      ArticleService.getServiceAreas(),
    ]);

    return {
      articles,
      featuredArticles,
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
    };
  } catch (error) {
    console.error("Error in magazine page load:", error);
    return {
      articles: [],
      featuredArticles: [],
      categories: [],
      serviceAreas: [],
      filters: {},
      meta: {
        title: "Magazine",
        description:
          "Discover home organisation, cleaning tips, and lifestyle content for small spaces in South Africa.",
      },
    };
  }
};
