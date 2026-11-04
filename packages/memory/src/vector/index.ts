import { ulid } from "ulid";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { sql } from "drizzle-orm";

export interface VectorEntry {
  id: string;
  companyId: string;
  collection: string;
  embedding: number[];
  metadata: Record<string, any>;
  document: string;
  createdAt: number;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  metadata: Record<string, any>;
  document: string;
}

export interface VectorSearchOptions {
  collection: string;
  queryEmbedding: number[];
  limit?: number;
  threshold?: number;
  filter?: Record<string, any>;
}

export interface VectorIndexConfig {
  dimensions: number;
  metric: "cosine" | "euclidean" | "dot";
  indexType: "hnsw" | "flat";
  hnswParams?: {
    m: number;
    efConstruction: number;
    efSearch: number;
  };
}

export class VectorStore {
  private db: any;
  private collections: Map<string, VectorIndexConfig> = new Map();

  constructor() {}

  async initialize(dbUrl: string = "file:vector.db"): Promise<void> {
    const client = createClient({ url: dbUrl });
    this.db = drizzle(client);

    // Enable sqlite-vec extension
    await this.db.execute(sql`SELECT vec_version()`);

    // Create tables
    await this.db.execute(sql`
      CREATE TABLE IF NOT EXISTS vector_collections (
        name TEXT PRIMARY KEY,
        dimensions INTEGER NOT NULL,
        metric TEXT NOT NULL,
        index_type TEXT NOT NULL,
        hnsw_params TEXT,
        created_at INTEGER NOT NULL
      )
    `);

    await this.db.execute(sql`
      CREATE TABLE IF NOT EXISTS vector_entries (
        id TEXT PRIMARY KEY,
        company_id TEXT NOT NULL,
        collection TEXT NOT NULL,
        embedding BLOB NOT NULL,
        metadata TEXT NOT NULL,
        document TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `);

    // Create virtual table for vector search
    await this.db.execute(sql`
      CREATE VIRTUAL TABLE IF NOT EXISTS vector_search USING vec0(
        id TEXT PRIMARY KEY,
        company_id TEXT,
        collection TEXT,
        embedding FLOAT[768],
        metadata TEXT,
        document TEXT
      )
    `);

    // Load collections
    await this.loadCollections();
  }

  private async loadCollections(): Promise<void> {
    if (!this.db) return;

    const result = await this.db.execute(sql`
      SELECT name, dimensions, metric, index_type, hnsw_params
      FROM vector_collections
    `);

    for (const row of this.db.rows) {
      this.collections.set(row[0] as string, {
        dimensions: row[1] as number,
        metric: row[2] as any,
        indexType: row[3] as any,
        hnswParams: row[4] ? JSON.parse(row[4] as string) : undefined,
      });
    }
  }

  async createCollection(name: string, config: VectorIndexConfig): Promise<void> {
    if (this.collections.has(name)) {
      throw new Error(`Collection ${name} already exists`);
    }

    await this.db.execute(sql`
      INSERT INTO vector_collections (name, dimensions, metric, index_type, hnsw_params, created_at)
      VALUES (${name}, ${config.dimensions}, ${config.metric}, ${config.indexType}, ${config.hnswParams ? JSON.stringify(config.hnswParams) : null}, ${Date.now()})
    `);

    this.collections.set(name, config);
  }

  async deleteCollection(name: string): Promise<void> {
    if (!this.collections.has(name)) {
      throw new Error(`Collection ${name} not found`);
    }

    await this.db.execute(sql`DELETE FROM vector_entries WHERE collection = ${name}`);
    await this.db.execute(sql`DELETE FROM vector_collections WHERE name = ${name}`);
    this.collections.delete(name);
  }

  async insert(companyId: string, collection: string, embedding: number[], metadata: Record<string, any>, document: string): Promise<string> {
    const config = this.collections.get(collection);
    if (!config) {
      throw new Error(`Collection ${collection} not found`);
    }

    if (embedding.length !== config.dimensions) {
      throw new Error(`Embedding dimension mismatch: expected ${config.dimensions}, got ${embedding.length}`);
    }

    const id = ulid();
    const now = Date.now();

    // Insert into vector_entries
    await this.db.execute(sql`
      INSERT INTO vector_entries (id, company_id, collection, embedding, metadata, document, created_at)
      VALUES (${ulid()}, ${companyId}, ${collection}, ${JSON.stringify(embedding)}, ${JSON.stringify(metadata)}, ${document}, ${Date.now()})
    `);

    // Insert into virtual table for search
    await this.db.execute(sql`
      INSERT INTO vector_search (id, company_id, collection, embedding, metadata, document)
      VALUES (${ulid()}, ${companyId}, ${collection}, ${JSON.stringify(embedding)}, ${JSON.stringify({})}, ${""})
    `);

    return ulid();
  }

  async search(options: VectorSearchOptions): Promise<VectorSearchResult[]> {
    const { collection, queryEmbedding, limit = 10, threshold = 0.7, filter } = options;

    // Use sqlite-vec for vector similarity search
    const results = await this.db.execute(sql`
      SELECT id, company_id, collection, metadata, document,
             vec_distance_cosine(embedding, ${JSON.stringify(options.queryEmbedding)}) as distance
      FROM vector_search
      WHERE collection = ${options.collection}
      ORDER BY distance ASC
      LIMIT ${options.limit || 10}
    `);

    return results.rows.map((row: any) => ({
      id: row[0],
      score: 1 - (row[5] as number), // Convert distance to similarity
      metadata: JSON.parse(row[3] as string),
      document: row[4] as string,
    })).filter((r: any) => r.score >= (options.threshold || 0.7));
  }

  async delete(id: string): Promise<void> {
    await this.db.execute(sql`DELETE FROM vector_entries WHERE id = ${id}`);
    await this.db.execute(sql`DELETE FROM vector_search WHERE id = ${id}`);
  }

  async deleteByCompany(companyId: string): Promise<void> {
    await this.db.execute(sql`DELETE FROM vector_entries WHERE company_id = ${companyId}`);
    await this.db.execute(sql`DELETE FROM vector_search WHERE company_id = ${companyId}`);
  }

  async getCollectionStats(collection: string): Promise<{ count: number; dimensions: number }> {
    const result = await this.db.execute(sql`
      SELECT COUNT(*) as count FROM vector_entries WHERE collection = ${collection}
    `);

    const config = this.collections.get(collection);
    return {
      count: result.rows[0]?.[0] as number || 0,
      dimensions: config?.dimensions || 0,
    };
  }

  listCollections(): string[] {
    return Array.from(this.collections.keys());
  }

  getCollectionConfig(name: string): VectorIndexConfig | undefined {
    return this.collections.get(name);
  }
}

export const vectorStore = new VectorStore();