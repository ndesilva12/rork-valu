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

    console.log(`[News] Fetching news for: ${query}`);
    const response = await fetch(rssUrl);

    if (!response.ok) {
      console.error(`[News] Failed to fetch: ${response.status} ${response.statusText}`);
      return [];
    }

    const xmlText = await response.text();
    console.log(`[News] Received ${xmlText.length} characters of XML`);

    // Simple XML parsing for RSS items
    const articles: NewsArticle[] = [];
    const itemMatches = xmlText.matchAll(/<item>(.*?)<\/item>/gs);

    for (const match of itemMatches) {
      const item = match[1];

      // Try both CDATA and regular text content
      const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s);
      const linkMatch = item.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/s);
      const pubDateMatch = item.match(/<pubDate>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/pubDate>/s);
      const sourceMatch = item.match(/<source[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/source>/s);
      const descriptionMatch = item.match(/<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/s);

      if (titleMatch && linkMatch) {
        articles.push({
          title: titleMatch[1].trim(),
          link: linkMatch[1].trim(),
          pubDate: pubDateMatch?.[1]?.trim() || new Date().toISOString(),
          source: sourceMatch?.[1]?.trim() || 'Google News',
          description: descriptionMatch?.[1]?.trim(),
        });
      }
    }

    console.log(`[News] Parsed ${articles.length} articles for "${query}"`);
    return articles.slice(0, 5); // Return top 5 articles per brand
  } catch (error) {
    console.error(`[News] Error fetching news for "${query}":`, error);
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
