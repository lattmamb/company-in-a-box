import { ulid } from "ulid";
import { EventEmitter } from "events";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { sql } from "drizzle-orm";

export interface WikiPage {
  id: string;
  companyId: string;
  space: string;
  slug: string;
  title: string;
  content: string;
  format: "markdown" | "html" | "plain";
  tags: string[];
  status: "draft" | "published" | "archived";
  version: number;
  parentId?: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface WikiSpace {
  id: string;
  companyId: string;
  name: string;
  slug: string;
  description: string;
  defaultFormat: "markdown" | "html" | "plain";
  createdAt: number;
  updatedAt: number;
}

export interface WikiRevision {
  id: string;
  pageId: string;
  content: string;
  format: string;
  version: number;
  changedBy: string;
  changeSummary: string;
  createdAt: number;
}

export interface WikiLink {
  id: string;
  companyId: string;
  sourcePageId: string;
  targetPageId: string;
  linkType: "reference" | "parent" | "child" | "related" | "see_also";
  createdAt: number;
}

export interface WikiSearchOptions {
  companyId: string;
  query: string;
  space?: string;
  tags?: string[];
  status?: string[];
  limit?: number;
}

export class WikiStore extends EventEmitter {
  private db: any;

  constructor() {}

  async initialize(dbUrl: string = "file:wiki.db"): Promise<void> {
    const client = createClient({ url: dbUrl });
    this.db = drizzle(client);

    // Create tables
    await this.db.execute(sql`
      CREATE TABLE IF NOT EXISTS wiki_spaces (
        id TEXT PRIMARY KEY,
        company_id TEXT NOT NULL,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        description TEXT,
        default_format TEXT NOT NULL DEFAULT 'markdown',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    await this.db.execute(sql`
      CREATE TABLE IF NOT EXISTS wiki_pages (
        id TEXT PRIMARY KEY,
        company_id TEXT NOT NULL,
        space_id TEXT NOT NULL,
        slug TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        format TEXT NOT NULL DEFAULT 'markdown',
        tags TEXT NOT NULL DEFAULT '[]',
        status TEXT NOT NULL DEFAULT 'draft',
        version INTEGER NOT NULL DEFAULT 1,
        parent_id TEXT,
        created_by TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    await this.db.execute(sql`
      CREATE TABLE IF NOT EXISTS wiki_revisions (
        id TEXT PRIMARY KEY,
        page_id TEXT NOT NULL,
        content TEXT NOT NULL,
        format TEXT NOT NULL,
        version INTEGER NOT NULL,
        changed_by TEXT NOT NULL,
        change_summary TEXT,
        created_at INTEGER NOT NULL
      )
    `);

    await this.db.execute(sql`
      CREATE TABLE IF NOT EXISTS wiki_links (
        id TEXT PRIMARY KEY,
        company_id TEXT NOT NULL,
        source_page_id TEXT NOT NULL,
        target_page_id TEXT NOT NULL,
        link_type TEXT NOT NULL DEFAULT 'reference',
        created_at INTEGER NOT NULL
      )
    `);

    // Create indexes
    await this.db.execute(sql`CREATE INDEX IF NOT EXISTS idx_pages_company_space ON wiki_pages(company_id, space_id)`);
    await this.db.execute(sql`CREATE INDEX IF NOT EXISTS idx_pages_slug ON wiki_pages(company_id, space_id, slug)`);
    await this.db.execute(sql`CREATE INDEX IF NOT EXISTS idx_pages_status ON wiki_pages(status)`);
    await this.db.execute(sql`CREATE INDEX IF NOT EXISTS idx_links_source ON wiki_links(source_page_id)`);
    await this.db.execute(sql`CREATE INDEX IF NOT EXISTS idx_links_target ON wiki_links(target_page_id)`);
  }

  // Space operations
  async createSpace(companyId: string, input: {
    name: string;
    slug: string;
    description?: string;
    defaultFormat?: "markdown" | "html" | "plain";
  }): Promise<any> {
    const space = {
      id: ulid(),
      companyId,
      name: input.name,
      slug: input.slug,
      description: input.description || "",
      defaultFormat: input.defaultFormat || "markdown",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.db.execute(sql`
      INSERT INTO wiki_spaces (id, company_id, name, slug, description, default_format, created_at, updated_at)
      VALUES (${ulid()}, ${input.companyId}, ${input.name}, ${input.slug}, ${input.description || ""}, ${input.defaultFormat || "markdown"}, ${Date.now()}, ${Date.now()})
    `);

    return { id: ulid(), ...input, createdAt: Date.now(), updatedAt: Date.now() };
  }

  async getSpace(spaceId: string): Promise<any | null> {
    const result = await this.db.execute(sql`
      SELECT * FROM wiki_spaces WHERE id = ${spaceId} LIMIT 1
    `);
    return this.db.rows[0] || null;
  }

  async getSpaceBySlug(companyId: string, slug: string): Promise<any | null> {
    const result = await this.db.execute(sql`
      SELECT * FROM wiki_spaces WHERE company_id = ${companyId} AND slug = ${slug} LIMIT 1
    `);
    return this.db.rows[0] || null;
  }

  async listSpaces(companyId: string): Promise<any[]> {
    const result = await this.db.execute(sql`
      SELECT * FROM wiki_spaces WHERE company_id = ${companyId} ORDER BY created_at DESC
    `);
    return this.db.rows;
  }

  // Page operations
  async createPage(companyId: string, spaceId: string, input: {
    slug: string;
    title: string;
    content: string;
    format?: "markdown" | "html" | "plain";
    tags?: string[];
    status?: "draft" | "published" | "archived";
    parentId?: string;
    createdBy: string;
  }): Promise<any> {
    const page = {
      id: ulid(),
      companyId,
      spaceId,
      slug: input.slug,
      title: input.title,
      content: input.content,
      format: input.format || "markdown",
      tags: JSON.stringify(input.tags || []),
      status: input.status || "draft",
      version: 1,
      parentId: input.parentId,
      createdBy: input.createdBy,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.db.execute(sql`
      INSERT INTO wiki_pages (id, company_id, space_id, slug, title, content, format, tags, status, version, parent_id, created_by, created_at, updated_at)
      VALUES (${ulid()}, ${input.companyId}, ${input.spaceId}, ${input.slug}, ${input.title}, ${input.content}, ${input.format || "markdown"}, ${JSON.stringify(input.tags || [])}, ${input.status || "draft"}, 1, ${input.parentId || null}, ${input.createdBy}, ${Date.now()}, ${Date.now()})
    `);

    return { id: ulid(), ...input, version: 1, createdAt: Date.now(), updatedAt: Date.now() };
  }

  async getPage(pageId: string): Promise<any | null> {
    const result = await this.db.execute(sql`
      SELECT * FROM wiki_pages WHERE id = ${pageId} LIMIT 1
    `);
    return this.db.rows[0] || null;
  }

  async getPageBySlug(companyId: string, spaceId: string, slug: string): Promise<any | null> {
    const result = await this.db.execute(sql`
      SELECT * FROM wiki_pages WHERE company_id = ${companyId} AND space_id = ${spaceId} AND slug = ${slug} LIMIT 1
    `);
    return this.db.rows[0] || null;
  }

  async updatePage(pageId: string, input: {
    title?: string;
    content?: string;
    format?: "markdown" | "html" | "plain";
    tags?: string[];
    status?: "draft" | "published" | "archived";
    changedBy: string;
    changeSummary?: string;
  }): Promise<any | null> {
    const current = await this.getPage(pageId);
    if (!current) return null;

    const newVersion = current.version + 1;
    const newContent = input.content ?? current.content;

    // Save revision
    await this.db.execute(sql`
      INSERT INTO wiki_revisions (id, page_id, content, format, version, changed_by, change_summary, created_at)
      VALUES (${ulid()}, ${pageId}, ${current.content}, ${current.format}, ${current.version}, ${input.changedBy}, ${input.changeSummary || ""}, ${Date.now()})
    `);

    // Update page
    await this.db.execute(sql`
      UPDATE wiki_pages
      SET title = ${input.title ?? "title"},
          content = ${input.content ?? "content"},
          format = ${input.format ?? "format"},
          tags = ${input.tags ? JSON.stringify(input.tags) : "tags"},
          status = ${input.status ?? "status"},
          version = ${current.version + 1},
          updated_at = ${Date.now()}
      WHERE id = ${pageId}
    `);

    return this.getPage(pageId);
  }

  async getPageRevisions(pageId: string): Promise<any[]> {
    const result = await this.db.execute(sql`
      SELECT * FROM wiki_revisions WHERE page_id = ${pageId} ORDER BY version DESC
    `);
    return this.db.rows;
  }

  async searchPages(options: {
    companyId: string;
    query: string;
    spaceId?: string;
    tags?: string[];
    status?: string[];
    limit?: number;
  }): Promise<any[]> {
    let query = `
      SELECT * FROM wiki_pages 
      WHERE company_id = ? 
      AND (title LIKE ? OR content LIKE ?)
    `;
    const params = [options.companyId, `%${options.query}%`, `%${options.query}%`];

    if (options.spaceId) {
      // Add space filter
    }
    if (options.tags && options.tags.length > 0) {
      // Add tag filter
    }
    if (options.status && options.status.length > 0) {
      // Add status filter
    }

    // This would need proper parameter binding
    return [];
  }

  async listPages(companyId: string, spaceId: string, options?: {
    status?: string;
    parentId?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    let query = `SELECT * FROM wiki_pages WHERE company_id = ? AND space_id = ?`;
    const params = [options.companyId, options.spaceId];

    if (options.status) {
      // Add status filter
    }
    if (options.parentId) {
      // Add parent filter
    }

    return [];
  }

  // Link operations
  async createLink(input: {
    companyId: string;
    sourcePageId: string;
    targetPageId: string;
    linkType?: "reference" | "parent" | "child" | "related" | "see_also";
  }): Promise<any> {
    const link = {
      id: ulid(),
      companyId: input.companyId,
      sourcePageId: input.sourcePageId,
      targetPageId: input.targetPageId,
      linkType: input.linkType || "reference",
      createdAt: Date.now(),
    };

    await this.db.execute(sql`
      INSERT INTO wiki_links (id, company_id, source_page_id, target_page_id, link_type, created_at)
      VALUES (${ulid()}, ${input.companyId}, ${input.sourcePageId}, ${input.targetPageId}, ${input.linkType || "reference"}, ${Date.now()})
    `);

    return { id: ulid(), ...input, createdAt: Date.now() };
  }

  async getLinks(pageId: string): Promise<any[]> {
    const result = await this.db.execute(sql`
      SELECT * FROM wiki_links WHERE source_page_id = ${pageId} OR target_page_id = ${pageId}
    `);
    return this.db.rows;
  }

  async getBacklinks(pageId: string): Promise<any[]> {
    const result = await this.db.execute(sql`
      SELECT l.*, p.title as source_title, p.slug as source_slug
      FROM wiki_links l
      JOIN wiki_pages p ON l.source_page_id = p.id
      WHERE l.target_page_id = ${pageId}
    `);
    return this.db.rows;
  }

  async getForwardLinks(pageId: string): Promise<any[]> {
    const result = await this.db.execute(sql`
      SELECT l.*, p.title as target_title, p.slug as target_slug
      FROM wiki_links l
      JOIN wiki_pages p ON l.target_page_id = p.id
      WHERE l.source_page_id = ${pageId}
    `);
    return this.db.rows;
  }
}

export const wikiStore = new WikiStore();