import { z } from "zod";
import { publicProcedure } from "../../../create-context";

interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  description?: string;
}

// Parse Google News RSS feed
async function parseGoogleNewsRSS(query: string): Promise<NewsArticle[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const rssUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;

    const response = await fetch(rssUrl);
    const xmlText = await response.text();

    // Simple XML parsing for RSS items
    const articles: NewsArticle[] = [];
    const itemMatches = xmlText.matchAll(/<item>(.*?)<\/item>/gs);

    for (const match of itemMatches) {
      const item = match[1];

      const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
      const linkMatch = item.match(/<link>(.*?)<\/link>/);
      const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
      const sourceMatch = item.match(/<source.*?>(.*?)<\/source>/);
      const descriptionMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/);

      if (titleMatch && linkMatch) {
        articles.push({
          title: titleMatch[1],
          link: linkMatch[1],
          pubDate: pubDateMatch?.[1] || '',
          source: sourceMatch?.[1] || 'Google News',
          description: descriptionMatch?.[1],
        });
      }
    }

    return articles.slice(0, 5); // Return top 5 articles per brand
  } catch (error) {
    console.error(`Error fetching news for "${query}":`, error);
    return [];
  }
}

export const getArticlesProcedure = publicProcedure
  .input(
    z.object({
      brandNames: z.array(z.string()),
    })
  )
  .query(async ({ input }) => {
    const { brandNames } = input;

    // Fetch news for each brand
    const newsPromises = brandNames.map(async (brandName) => {
      const articles = await parseGoogleNewsRSS(brandName);
      return {
        brandName,
        articles,
      };
    });

    const newsResults = await Promise.all(newsPromises);

    // Flatten and combine all articles
    const allArticles = newsResults.flatMap((result) =>
      result.articles.map((article) => ({
        ...article,
        brandName: result.brandName,
      }))
    );

    // Sort by publication date (newest first)
    allArticles.sort((a, b) => {
      const dateA = new Date(a.pubDate).getTime();
      const dateB = new Date(b.pubDate).getTime();
      return dateB - dateA;
    });

    return {
      articles: allArticles,
      totalCount: allArticles.length,
    };
  });
