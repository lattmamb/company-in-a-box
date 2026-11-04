import { ulid } from "ulid";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { sql } from "drizzle-orm";

export interface CacheEntry {
  key: string;
  value: any;
  expiresAt: number;
  createdAt: number;
  hits: number;
  size: number;
}

export interface CacheConfig {
  maxSize: number; // bytes
  defaultTtl: number; // milliseconds
  cleanupInterval: number; // milliseconds
}

export interface SemanticCacheEntry {
  id: string;
  embedding: number[];
  requestHash: string;
  request: any;
  response: any;
  createdAt: number;
  hits: number;
  similarityThreshold: number;
}

export class ResponseCache {
  private db: any;
  private config: CacheConfig;
  private memoryCache: Map<string, CacheEntry> = new Map();
  private semanticCache: Map<string, SemanticCacheEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: config.maxSize || 100 * 1024 * 1024, // 100MB
      defaultTtl: config.defaultTtl || 3600000, // 1 hour
      cleanupInterval: config.cleanupInterval || 300000, // 5 minutes
    };
  }

  async initialize(dbUrl: string = "file:cache.db"): Promise<void> {
    const client = createClient({ url: dbUrl });
    this.db = drizzle(client);

    // Create tables
    await this.db.execute(sql`
      CREATE TABLE IF NOT EXISTS cache_entries (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        hits INTEGER NOT NULL DEFAULT 0,
        size INTEGER NOT NULL DEFAULT 0
      )
    `);

    await this.db.execute(sql`
      CREATE TABLE IF NOT EXISTS semantic_cache (
        id TEXT PRIMARY KEY,
        embedding TEXT NOT NULL,
        request_hash TEXT NOT NULL,
        request TEXT NOT NULL,
        response TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        hits INTEGER NOT NULL DEFAULT 0,
        similarity_threshold REAL NOT NULL DEFAULT 0.85
      )
    `);

    // Load existing entries into memory
    await this.loadFromDisk();

    // Start cleanup interval
    this.startCleanupInterval();
  }

  private async loadFromDisk(): Promise<void> {
    if (!this.db) return;

    const entries = await this.db.execute(sql`
      SELECT key, value, expires_at, created_at, hits, size
      FROM cache_entries
      WHERE expires_at > ${Date.now()}
    `);

    for (const row of entries.rows) {
      const entry = {
        key: row[0] as string,
        value: JSON.parse(row[1] as string),
        expiresAt: row[2] as number,
        createdAt: row[3] as number,
        hits: row[4] as number,
        size: row[5] as number,
      };
      this.memoryCache.set(entry.key, entry);
    }
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  async get(key: string): Promise<any | null> {
    // Check memory cache first
    const entry = this.memoryCache.get(key);
    if (entry) {
      if (entry.expiresAt > Date.now()) {
        entry.hits++;
        return entry.value;
      } else {
        // Expired
        this.memoryCache.delete(key);
        await this.deleteFromDisk(key);
        return null;
      }
    }

    // Check disk
    const diskEntry = await this.getFromDisk(key);
    if (diskEntry) {
      this.memoryCache.set(key, diskEntry);
      return diskEntry.value;
    }

    return null;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const now = Date.now();
    const ttlMs = ttl || this.config.defaultTtl;
    const expiresAt = now + ttlMs;
    const serialized = JSON.stringify(value);
    const size = Buffer.byteLength(serialized, "utf8");

    const entry: CacheEntry = {
      key,
      value,
      expiresAt,
      createdAt: Date.now(),
      hits: 0,
      size: size,
    };

    this.memoryCache.set(key, entry);
    await this.saveToDisk(key, value, expiresAt, size);
  }

  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    await this.deleteFromDisk(key);
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    if (this.db) {
      await this.db.execute(sql`DELETE FROM cache_entries`);
    }
  }

  async getStats(): Promise<{
    entries: number;
    totalSize: number;
    hitRate: number;
  }> {
    let totalSize = 0;
    let totalHits = 0;
    let totalRequests = 0;

    for (const entry of this.memoryCache.values()) {
      totalSize += entry.size;
      totalHits += entry.hits;
      totalRequests += entry.hits + 1; // approximate
    }

    return {
      entries: this.memoryCache.size,
      totalSize,
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
    };
  }

  // Semantic cache methods
  async semanticGet(request: any, embedding: number[], threshold = 0.85): Promise<any | null> {
    // In a real implementation, this would use vector similarity search
    // For now, we'll use a simple hash-based approach
    const requestHash = this.hashRequest(request);
    
    // Check exact match first
    const exactMatch = this.semanticCache.get(requestHash);
    if (exactMatch && exactMatch.hits > 0) {
      exactMatch.hits++;
      return exactMatch.response;
    }

    // In a real implementation, we'd do vector similarity search here
    // For now, return null
    return null;
  }

  async semanticSet(request: any, response: any, embedding: number[]): Promise<void> {
    const requestHash = this.hashRequest(request);
    const entry: SemanticCacheEntry = {
      id: ulid(),
      embedding,
      requestHash,
      request,
      response,
      createdAt: Date.now(),
      hits: 0,
      similarityThreshold: 0.85,
    };

    this.semanticCache.set(requestHash, entry);
    // In a real implementation, save to vector database
  }

  private hashRequest(request: any): string {
    // Simple hash for now - in production use a proper hash
    return Buffer.from(JSON.stringify(request)).toString("base64").slice(0, 32);
  }

  private async saveToDisk(key: string, value: any, expiresAt: number, size: number): Promise<void> {
    if (!this.db) return;

    await this.db.execute(sql`
      INSERT OR REPLACE INTO cache_entries (key, value, expires_at, created_at, hits, size)
      VALUES (${key}, ${JSON.stringify(value)}, ${Date.now() + 3600000}, ${Date.now()}, 0, ${Buffer.byteLength(JSON.stringify(value), "utf8")})
    `);
  }

  private async getFromDisk(key: string): Promise<any | null> {
    if (!this.db) return null;

    const result = await this.db.execute(sql`
      SELECT value, expires_at, created_at, hits, size
      FROM cache_entries
      WHERE key = ${key} AND expires_at > ${Date.now()}
      LIMIT 1
    `);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      key,
      value: JSON.parse(row[0] as string),
      expiresAt: row[1] as number,
      createdAt: row[2] as number,
      hits: row[3] as number,
      size: row[4] as number,
    };
  }

  private async deleteFromDisk(key: string): Promise<void> {
    if (!this.db) return;
    await this.db.execute(sql`DELETE FROM cache_entries WHERE key = ${key}`);
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiresAt < now) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }

    // Also clean disk
    if (this.db) {
      this.db.execute(sql`DELETE FROM cache_entries WHERE expires_at < ${now}`);
    }

    if (cleaned > 0) {
      console.log(`Cache cleanup: removed ${cleaned} expired entries`);
    }
  }

  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

export const responseCache = new ResponseCache();