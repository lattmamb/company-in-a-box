import { ulid } from "ulid";
import { EventEmitter } from "events";
import { vectorStore } from "../vector";
import { graphStore } from "../graph";

export interface MemoryProxyConfig {
  vectorDimensions: number;
  embeddingModel: string;
  maxContextTokens: number;
  similarityThreshold: number;
  maxResults: number;
}

export interface MemoryQuery {
  query: string;
  companyId: string;
  collections?: string[];
  limit?: number;
  threshold?: number;
  includeGraph?: boolean;
}

export interface MemoryResult {
  query: string;
  vectorResults: any[];
  graphResults?: any[];
  combinedContext: string;
  sources: MemorySource[];
  timestamp: number;
}

export interface MemorySource {
  type: "vector" | "graph";
  id: string;
  content: string;
  score: number;
  metadata: Record<string, any>;
}

export interface MemoryIngestInput {
  companyId: string;
  documents: Array<{
    content: string;
    metadata: Record<string, any>;
    collection?: string;
  }>;
}

export class MemoryProxy extends EventEmitter {
  private config: MemoryProxyConfig;
  private embeddingCache: Map<string, number[]> = new Map();

  constructor(config: Partial<MemoryProxyConfig> = {}) {
    super();
    this.config = {
      vectorDimensions: config.vectorDimensions || 768,
      embeddingModel: config.embeddingModel || "qwen3-embedding:0.6b",
      maxContextTokens: config.maxContextTokens || 8192,
      similarityThreshold: config.similarityThreshold || 0.7,
      maxResults: config.maxResults || 10,
    };
  }

  async initialize(): Promise<void> {
    await vectorStore.initialize();
    await graphStore.initialize();
  }

  async query(input: MemoryQuery): Promise<MemoryResult> {
    const { query, companyId, collections, limit, threshold, includeGraph } = input;

    // Generate embedding for query
    const queryEmbedding = await this.generateEmbedding(query);

    // Vector search
    const vectorResults = await vectorStore.search({
      collection: collections?.[0] || "default",
      queryEmbedding,
      limit: input.limit || this.config.maxResults,
      threshold: input.threshold || this.config.similarityThreshold,
    });

    // Graph search (optional)
    let graphResults: any[] = [];
    if (input.includeGraph) {
      // Graph traversal would go here
      // For now, return empty
    }

    // Combine results into context
    const combinedContext = this.buildContext(vectorResults, []);
    const sources = this.buildSources(vectorResults, []);

    return {
      query,
      vectorResults,
      graphResults,
      combinedContext,
      sources,
      timestamp: Date.now(),
    };
  }

  async ingest(input: MemoryIngestInput): Promise<{ inserted: number; failed: number }> {
    let inserted = 0;
    let failed = 0;

    for (const doc of input.documents) {
      try {
        const embedding = await this.generateEmbedding(doc.content);
        
        await vectorStore.insert(
          input.companyId,
          doc.collection || "default",
          embedding,
          doc.metadata,
          doc.content
        );

        // Also add to graph
        await graphStore.addNode(input.companyId, {
          companyId: input.companyId,
          type: "document",
          label: doc.metadata.title || "Document",
          properties: {
            content: doc.content,
            ...doc.metadata,
          },
        });

        inserted++;
      } catch (error) {
        console.error("Failed to ingest document:", error);
        failed++;
      }
    }

    return { inserted, failed };
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Check cache first
    const cacheKey = this.hashText(text);
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey)!;
    }

    // In a real implementation, this would call an embedding model
    // For now, return a mock embedding
    const embedding = this.mockEmbedding(text);
    
    this.embeddingCache.set(cacheKey, embedding);
    return embedding;
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

  private buildContext(vectorResults: any[], graphResults: any[]): string {
    const parts: string[] = [];

    if (vectorResults.length > 0) {
      parts.push("=== Vector Search Results ===");
      for (const result of vectorResults) {
        parts.push(`[Score: ${result.score.toFixed(3)}] ${result.document}`);
      }
    }

    if (graphResults.length > 0) {
      parts.push("\n=== Graph Results ===");
      for (const result of graphResults) {
        parts.push(`[${result.type}] ${result.label}: ${JSON.stringify(result.properties)}`);
      }
    }

    return parts.join("\n\n");
  }

  private buildSources(vectorResults: any[], graphResults: any[]): MemorySource[] {
    const sources: MemorySource[] = [];

    for (const result of vectorResults) {
      sources.push({
        type: "vector",
        id: result.id,
        content: result.document,
        score: result.score,
        metadata: result.metadata,
      });
    }

    for (const result of graphResults) {
      sources.push({
        type: "graph",
        id: result.id,
        content: JSON.stringify(result.properties),
        score: result.score || 1.0,
        metadata: result.properties,
      });
    }

    return sources;
  }

  async getStats(): Promise<{
    vectorCollections: number;
    totalVectors: number;
    graphNodes: number;
    graphEdges: number;
  }> {
    const collections = vectorStore.listCollections();
    let totalVectors = 0;

    for (const collection of collections) {
      const stats = await vectorStore.getCollectionStats(collection);
      totalVectors += stats.count;
    }

    // Graph stats would come from graphStore
    return {
      vectorCollections: collections.length,
      totalVectors,
      graphNodes: 0,
      graphEdges: 0,
    };
  }
}

export const memoryProxy = new MemoryProxy();