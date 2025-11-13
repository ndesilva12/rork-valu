import type { VercelRequest, VercelResponse } from '@vercel/node';

interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  description?: string;
  brandName: string;
}

// Parse Google News RSS feed
async function parseGoogleNewsRSS(query: string): Promise<Omit<NewsArticle, 'brandName'>[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const rssUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;

    console.log(`[News API] Fetching news for: ${query}`);
    const response = await fetch(rssUrl);

    if (!response.ok) {
      console.error(`[News API] Failed to fetch: ${response.status} ${response.statusText}`);
      return [];
    }

    const xmlText = await response.text();
    console.log(`[News API] Received ${xmlText.length} characters of XML`);

    // Simple XML parsing for RSS items
    const articles: Omit<NewsArticle, 'brandName'>[] = [];
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

    console.log(`[News API] Parsed ${articles.length} articles for "${query}"`);
    return articles.slice(0, 5); // Return top 5 articles per brand
  } catch (error) {
    console.error(`[News API] Error fetching news for "${query}":`, error);
    return [];
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { brandNames } = req.body;

    if (!Array.isArray(brandNames)) {
      return res.status(400).json({ error: 'brandNames must be an array' });
    }

    console.log('[News API] Fetching news for brands:', brandNames);

    // Fetch news for each brand
    const newsPromises = brandNames.map(async (brandName: string) => {
      const articles = await parseGoogleNewsRSS(brandName);
      return articles.map((article) => ({
        ...article,
        brandName,
      }));
    });

    const newsResults = await Promise.all(newsPromises);

    // Flatten and combine all articles
    const allArticles = newsResults.flat();

    // Sort by publication date (newest first)
    allArticles.sort((a, b) => {
      const dateA = new Date(a.pubDate).getTime();
      const dateB = new Date(b.pubDate).getTime();
      return dateB - dateA;
    });

    console.log('[News API] Returning', allArticles.length, 'articles');

    return res.status(200).json({
      articles: allArticles,
      totalCount: allArticles.length,
    });
  } catch (error) {
    console.error('[News API] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
