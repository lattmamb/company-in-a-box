import { ulid } from "ulid";
import { EventEmitter } from "events";
import { z } from "zod";

export interface SearchResult {
  id: string;
  title: string;
  url: string;
  snippet: string;
  source: string;
  publishedAt?: number;
  score: number;
  metadata: Record<string, any>;
}

export interface SearchOptions {
  query: string;
  sources?: string[];
  limit?: number;
  timeRange?: "day" | "week" | "month" | "year" | "all";
  language?: string;
  region?: string;
  safeSearch?: boolean;
}

export interface SearchConfig {
  defaultSources: string[];
  defaultLimit: number;
  defaultTimeRange: "day" | "week" | "month" | "year" | "all";
  cacheEnabled: boolean;
  cacheTtl: number;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
}

export interface SearchProvider {
  name: string;
  search(options: SearchOptions): Promise<SearchResult[]>;
  getRateLimit(): { remaining: number; resetAt: number };
}

export class SearchEngine extends EventEmitter {
  private config: SearchConfig;
  private providers: Map<string, SearchProvider> = new Map();
  private cache: Map<string, { results: SearchResult[]; timestamp: number }> = new Map();
  private rateLimits: Map<string, { count: number; resetAt: number }> = new Map();

  constructor(config: Partial<SearchConfig> = {}) {
    super();
    this.config = {
      defaultSources: config.defaultSources || ["google", "bing", "duckduckgo", "github", "reddit", "twitter", "youtube", "linkedin"],
      defaultLimit: config.defaultLimit || 10,
      defaultTimeRange: config.defaultTimeRange || "week",
      cacheEnabled: config.cacheEnabled !== false,
      cacheTtl: config.cacheTtl || 3600000, // 1 hour
      rateLimit: config.rateLimit || { requestsPerMinute: 60, requestsPerHour: 1000 },
    };
  }

  registerProvider(provider: SearchProvider): void {
    this.providers.set(provider.name, provider);
  }

  async search(options: SearchOptions): Promise<SearchResult[]> {
    const {
      query,
      sources = this.config.defaultSources,
      limit = this.config.defaultLimit,
      timeRange = this.config.defaultTimeRange,
      language = "en",
      region = "us",
      safeSearch = true,
    } = options;

    // Check cache
    const cacheKey = this.getCacheKey(query, sources, limit, timeRange, language, region, safeSearch);
    if (this.config.cacheEnabled) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.config.cacheTtl) {
        this.emit("cacheHit", { query, count: cached.results.length });
        return cached.results.slice(0, limit);
      }
    }

    // Check rate limits
    const rateLimitKey = "global";
    const rateLimit = this.rateLimits.get(rateLimitKey) || { count: 0, resetAt: Date.now() + 60000 };
    if (Date.now() > rateLimit.resetAt) {
      rateLimit.count = 0;
      rateLimit.resetAt = Date.now() + 60000;
    }
    if (rateLimit.count >= this.config.rateLimit.requestsPerMinute) {
      throw new Error("Rate limit exceeded");
    }
    rateLimit.count++;
    this.rateLimits.set(rateLimitKey, rateLimit);

    // Search across providers
    const providerPromises = sources.map(async (sourceName) => {
      const provider = this.providers.get(sourceName);
      if (!provider) {
        console.warn(`Provider ${sourceName} not found`);
        return [];
      }

      try {
        const results = await provider.search({ query, limit: Math.ceil(limit / sources.length), timeRange, language, region, safeSearch });
        return results.map(r => ({ ...r, source: sourceName }));
      } catch (error) {
        console.error(`Provider ${sourceName} error:`, error);
        return [];
      }
    });

    const results = await Promise.all(providerPromises);
    const allResults = results.flat();

    // Sort by score and deduplicate
    const uniqueResults = this.deduplicateResults(allResults);
    const sortedResults = uniqueResults
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Cache results
    if (this.config.cacheEnabled) {
      this.cache.set(cacheKey, { results: sortedResults, timestamp: Date.now() });
    }

    this.emit("searchComplete", { query, count: sortedResults.length, sources });
    return sortedResults;
  }

  private getCacheKey(query: string, sources: string[], limit: number, timeRange: string, language: string, region: string, safeSearch: boolean): string {
    return `${query}|${sources.join(",")}|${limit}|${timeRange}|${language}|${region}|${safeSearch}`;
  }

  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      const key = result.url || result.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Provider implementations
  registerDefaultProviders(): void {
    // Google Search (via Custom Search API)
    this.registerProvider({
      name: "google",
      async search(options) {
        // In a real implementation, this would call Google Custom Search API
        return this.mockSearch("google", options);
      },
      getRateLimit() { return { remaining: 100, resetAt: Date.now() + 3600000 }; },
    });

    // Bing Search
    this.registerProvider({
      name: "bing",
      async search(options) {
        return this.mockSearch("bing", options);
      },
      getRateLimit() { return { remaining: 100, resetAt: Date.now() + 3600000 }; },
    });

    // DuckDuckGo
    this.registerProvider({
      name: "duckduckgo",
      async search(options) {
        return this.mockSearch("duckduckgo", options);
      },
      getRateLimit() { return { remaining: 100, resetAt: Date.now() + 3600000 }; },
    });

    // GitHub
    this.registerProvider({
      name: "github",
      async search(options) {
        return this.mockSearch("github", options);
      },
      getRateLimit() { return { remaining: 30, resetAt: Date.now() + 3600000 }; },
    });

    // Reddit
    this.registerProvider({
      name: "reddit",
      async search(options) {
        return this.mockSearch("reddit", options);
      },
      getRateLimit() { return { remaining: 60, resetAt: Date.now() + 3600000 }; },
    });

    // Twitter/X
    this.registerProvider({
      name: "twitter",
      async search(options) {
        return this.mockSearch("twitter", options);
      },
      getRateLimit() { return { remaining: 15, resetAt: Date.now() + 900000 }; },
    });

    // YouTube
    this.registerProvider({
      name: "youtube",
      async search(options) {
        return this.mockSearch("youtube", options);
      },
      getRateLimit() { return { remaining: 100, resetAt: Date.now() + 3600000 }; },
    });

    // LinkedIn
    this.registerProvider({
      name: "linkedin",
      async search(options) {
        return this.mockSearch("linkedin", options);
      },
      getRateLimit() { return { remaining: 10, resetAt: Date.now() + 3600000 }; },
    });
  }

  private mockSearch(source: string, options: any): any[] {
    // Mock implementation - in reality, this would call actual APIs
    const count = Math.min(options.limit || 10, 5);
    return Array.from({ length: count }, (_, i) => ({
      id: `mock-${source}-${Date.now()}-${i}`,
      title: `${source} result for "${options.query}" #${i + 1}`,
      url: `https://${source}.com/result/${i}`,
      snippet: `This is a mock search result from ${source} for query: ${options.query}`,
      source,
      publishedAt: Date.now() - Math.random() * 86400000 * 30,
      score: 0.9 - i * 0.1,
      metadata: { mock: true },
    }));
  }

  async searchWithAgentReach(query: string, options: Partial<SearchOptions> = {}): Promise<SearchResult[]> {
    // This would integrate with Agent-Reach for 14-platform search
    // For now, use the standard search with all sources
    return this.search({ ...options, query, sources: this.config.defaultSources });
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; hitRate: number } {
    return { size: this.cache.size, hitRate: 0 };
  }
}

export const searchEngine = new SearchEngine();
searchEngine.registerDefaultProviders();