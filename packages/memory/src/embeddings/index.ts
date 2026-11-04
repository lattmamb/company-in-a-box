import { ulid } from "ulid";
import { EventEmitter } from "events";

export interface EmbeddingConfig {
  model: string;
  dimensions: number;
  batchSize: number;
  maxTokens: number;
  cacheEnabled: boolean;
  cacheTtl: number;
}

export interface EmbeddingRequest {
  texts: string[];
  model?: string;
  dimensions?: number;
}

export interface EmbeddingResponse {
  embeddings: number[][];
  model: string;
  dimensions: number;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}

export interface EmbeddingCacheEntry {
  text: string;
  embedding: number[];
  model: string;
  createdAt: number;
  hits: number;
}

export class EmbeddingService extends EventEmitter {
  private config: EmbeddingConfig;
  private cache: Map<string, { embedding: number[]; model: string; createdAt: number; hits: number }> = new Map();
  private cacheSize: number = 0;
  private maxCacheSize: number = 10000;

  constructor(config: Partial<EmbeddingConfig> = {}) {
    super();
    this.config = {
      model: config.model || "qwen3-embedding:0.6b",
      dimensions: config.dimensions || 768,
      batchSize: config.batchSize || 32,
      maxTokens: config.maxTokens || 8192,
      cacheEnabled: config.cacheEnabled !== false,
      cacheTtl: config.cacheTtl || 86400000, // 24 hours
    };
  }

  async initialize(): Promise<void> {
    // Initialize embedding model connection
    // In a real implementation, this would connect to Ollama, OpenAI, etc.
  }

  async embed(texts: string[], options?: { model?: string; dimensions?: number }): Promise<number[][]> {
    const textsToEmbed = texts.filter(t => t && t.trim().length > 0);
    if (textsToEmbed.length === 0) return [];

    const results: number[][] = [];
    const toEmbed: string[] = [];
    const indices: number[] = [];

    // Check cache first
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      if (!text || text.trim().length === 0) {
        results.push(this.zeroVector());
        continue;
      }

      const cacheKey = this.getCacheKey(text);
      const cached = this.cache.get(text);
      if (this.config.cacheEnabled && this.cache.has(text)) {
        const cached = this.cache.get(text)!;
        cached.hits++;
        results.push(cached.embedding);
      } else {
        toEmbed.push(text);
        indices.push(results.length);
        results.push(null as any); // placeholder
      }
    }

    // Embed uncached texts
    if (toEmbed.length > 0) {
      const embeddings = await this.embedBatch(toEmbed);
      
      for (let i = 0; i < toEmbed.length; i++) {
        const embedding = embeddings[i];
        results[indices[i]] = embedding;
        
        // Cache the result
        if (this.config.cacheEnabled) {
          this.cache.set(toEmbed[i], {
            embedding,
            model: "default",
            createdAt: Date.now(),
            hits: 0,
          });
        }
      }
    }

    return results;
  }

  async embedSingle(text: string): Promise<number[]> {
    const results = await this.embed([text]);
    return results[0];
  }

  private async embedBatch(texts: string[]): Promise<number[][]> {
    // In a real implementation, this would call an embedding model
    // For now, return mock embeddings
    return texts.map(text => this.mockEmbedding(text));
  }

  private mockEmbedding(text: string): number[] {
    // Deterministic mock embedding based on text hash
    const hash = this.hashText(text);
    const embedding = new Array(768).fill(0);
    
    for (let i = 0; i < hash.length; i++) {
      const charCode = hash.charCodeAt(i);
      embedding[i % 768] += (charCode / 255) * 0.1;
    }

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(v => v / (magnitude || 1));
  }

  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }

  private zeroVector(): number[] {
    return new Array(768).fill(0);
  }

  async similarity(embedding1: number[], embedding2: number[]): Promise<number> {
    if (embedding1.length !== embedding2.length) {
      throw new Error("Embedding dimensions must match");
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    const magnitude1 = Math.sqrt(norm1);
    const magnitude2 = Math.sqrt(norm2);

    if (magnitude1 === 0 || magnitude2 === 0) return 0;

    return dotProduct / (magnitude1 * magnitude2);
  }

  async findSimilar(embedding: number[], candidates: number[][], topK: number = 5): Promise<Array<{ index: number; score: number }>> {
    const scores = await Promise.all(
      candidates.map(async (candidate, index) => ({
        index,
        score: await this.similarity(embedding, candidate),
      }))
    );

    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    let totalHits = 0;
    let totalRequests = 0;

    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
    }

    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: 0, // Would need to track total requests
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  async shutdown(): Promise<void> {
    this.cache.clear();
  }
}

export const embeddingService = new EmbeddingService();