import { ulid } from "ulid";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { sql } from "drizzle-orm";

export interface GraphNode {
  id: string;
  companyId: string;
  type: string;
  label: string;
  properties: Record<string, any>;
  embedding?: number[];
  createdAt: number;
  updatedAt: number;
}

export interface GraphEdge {
  id: string;
  companyId: string;
  sourceId: string;
  targetId: string;
  type: string;
  properties: Record<string, any>;
  weight: number;
  createdAt: number;
}

export interface GraphQueryOptions {
  companyId: string;
  nodeTypes?: string[];
  edgeTypes?: string[];
  limit?: number;
  depth?: number;
}

export interface GraphTraversalOptions {
  startNodeId: string;
  edgeTypes?: string[];
  direction?: "outgoing" | "incoming" | "both";
  maxDepth?: number;
  limit?: number;
  filter?: (node: GraphNode, edge: GraphEdge) => boolean;
}

export class GraphStore {
  private db: any;

  constructor() {}

  async initialize(dbUrl: string = "file:graph.db"): Promise<void> {
    const client = createClient({ url: dbUrl });
    this.db = drizzle(client);

    // Create tables
    await this.db.execute(sql`
      CREATE TABLE IF NOT EXISTS graph_nodes (
        id TEXT PRIMARY KEY,
        company_id TEXT NOT NULL,
        type TEXT NOT NULL,
        label TEXT NOT NULL,
        properties TEXT NOT NULL,
        embedding BLOB,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    await this.db.execute(sql`
      CREATE TABLE IF NOT EXISTS graph_edges (
        id TEXT PRIMARY KEY,
        company_id TEXT NOT NULL,
        source_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        type TEXT NOT NULL,
        properties TEXT NOT NULL,
        weight REAL NOT NULL DEFAULT 1.0,
        created_at INTEGER NOT NULL
      )
    `);

    // Create indexes
    await this.db.execute(sql`CREATE INDEX IF NOT EXISTS idx_nodes_company_type ON graph_nodes(company_id, type)`);
    await this.db.execute(sql`CREATE INDEX IF NOT EXISTS idx_edges_company_source ON graph_edges(company_id, source_id)`);
    await this.db.execute(sql`CREATE INDEX IF NOT EXISTS idx_edges_company_target ON graph_edges(company_id, target_id)`);
    await this.db.execute(sql`CREATE INDEX IF NOT EXISTS idx_edges_type ON graph_edges(company_id, type)`);
  }

  async addNode(companyId: string, input: Omit<GraphNode, "id" | "createdAt" | "updatedAt">): Promise<GraphNode> {
    const node: GraphNode = {
      ...input,
      id: ulid(),
      companyId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.db.execute(sql`
      INSERT INTO graph_nodes (id, company_id, type, label, properties, embedding, created_at, updated_at)
      VALUES (${ulid()}, ${companyId}, ${node.type}, ${node.label}, ${JSON.stringify(node.properties)}, ${node.embedding ? JSON.stringify(node.embedding) : null}, ${Date.now()}, ${Date.now()})
    `);

    return node;
  }

  async getNode(nodeId: string): Promise<GraphNode | null> {
    const result = await this.db.execute(sql`
      SELECT id, company_id, type, label, properties, embedding, created_at, updated_at
      FROM graph_nodes
      WHERE id = ${nodeId}
      LIMIT 1
    `);

    if (this.db.rows.length === 0) return null;

    const row = this.db.rows[0];
    return {
      id: row[0] as string,
      companyId: row[1] as string,
      type: row[2] as string,
      label: row[3] as string,
      properties: JSON.parse(row[4] as string),
      embedding: row[5] ? JSON.parse(row[5] as string) : undefined,
      createdAt: row[6] as number,
      updatedAt: row[7] as number,
    };
  }

  async updateNode(nodeId: string, updates: Partial<GraphNode>): Promise<GraphNode | null> {
    const node = await this.getNode(nodeId);
    if (!node) return null;

    const updated = { ...node, ...updates, updatedAt: Date.now() };

    await this.db.execute(sql`
      UPDATE graph_nodes
      SET label = ${updates.label ?? node.label},
          properties = ${updates.properties ? JSON.stringify(updates.properties) : JSON.stringify(node.properties)},
          embedding = ${updates.embedding ? JSON.stringify(updates.embedding) : (node.embedding ? JSON.stringify(node.embedding) : null)},
          updated_at = ${Date.now()}
      WHERE id = ${nodeId}
    `);

    return { ...node, ...updates, updatedAt: Date.now() };
  }

  async deleteNode(nodeId: string): Promise<void> {
    // Delete edges first
    await this.db.execute(sql`DELETE FROM graph_edges WHERE source_id = ${nodeId} OR target_id = ${nodeId}`);
    await this.db.execute(sql`DELETE FROM graph_nodes WHERE id = ${nodeId}`);
  }

  async addEdge(companyId: string, input: Omit<GraphEdge, "id" | "createdAt">): Promise<GraphEdge> {
    const edge: GraphEdge = {
      ...input,
      id: ulid(),
      companyId,
      createdAt: Date.now(),
    };

    await this.db.execute(sql`
      INSERT INTO graph_edges (id, company_id, source_id, target_id, type, properties, weight, created_at)
      VALUES (${ulid()}, ${companyId}, ${edge.sourceId}, ${edge.targetId}, ${edge.type}, ${JSON.stringify(edge.properties)}, ${edge.weight}, ${Date.now()})
    `);

    return edge;
  }

  async getEdges(companyId: string, nodeId: string, direction: "outgoing" | "incoming" | "both" = "both"): Promise<any[]> {
    let query = "";
    if (direction === "outgoing") {
      query = `SELECT * FROM graph_edges WHERE company_id = ? AND source_id = ?`;
    } else if (direction === "incoming") {
      query = `SELECT * FROM graph_edges WHERE company_id = ? AND target_id = ?`;
    } else {
      query = `SELECT * FROM graph_edges WHERE company_id = ? AND (source_id = ? OR target_id = ?)`;
    }

    // This would need proper parameter binding
    return [];
  }

  async traverse(options: {
    startNodeId: string;
    edgeTypes?: string[];
    direction?: "outgoing" | "incoming" | "both";
    maxDepth?: number;
    limit?: number;
    filter?: (node: any, edge: any) => boolean;
  }): Promise<{ nodes: any[]; edges: any[] }> {
    const { startNodeId, edgeTypes, direction = "outgoing", maxDepth = 3, limit = 100 } = options;
    
    const visited = new Set<string>();
    const nodes: any[] = [];
    const edges: any[] = [];
    const queue: Array<{ nodeId: string; depth: number }> = [{ nodeId: options.startNodeId, depth: 0 }];

    while (queue.length > 0 && nodes.length < (options.limit || 100)) {
      const { nodeId, depth } = queue.shift()!;
      
      if (visited.has(nodeId) || depth > (options.maxDepth || 3)) continue;
      visited.add(nodeId);

      const node = await this.getNode(nodeId);
      if (node) nodes.push(node);

      if (depth >= (options.maxDepth || 3)) continue;

      // Get edges
      const edgeResults = await this.db.execute(sql`
        SELECT * FROM graph_edges 
        WHERE company_id = (SELECT company_id FROM graph_nodes WHERE id = ${options.startNodeId})
        AND (source_id = ? OR target_id = ?)
      `);

      for (const row of this.db.rows) {
        const edge = {
          id: row[0],
          companyId: row[1],
          sourceId: row[2],
          targetId: row[3],
          type: row[4],
          properties: JSON.parse(row[5]),
          weight: row[6],
          createdAt: row[7],
        };

        edges.push(edge);

        const nextNodeId = edge.sourceId === options.startNodeId ? edge.targetId : edge.sourceId;
        if (!visited.has(nextNodeId)) {
          queue.push({ nodeId: nextNodeId, depth: 1 });
        }
      }
    }

    return { nodes, edges };
  }

  async findPath(startId: string, endId: string, maxDepth = 5): Promise<string[] | null> {
    // BFS for shortest path
    const queue: Array<{ nodeId: string; path: string[] }> = [{ nodeId: startId, path: [startId] }];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { nodeId, path } = queue.shift()!;
      
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      if (nodeId === endId) {
        return path;
      }

      if (path.length >= 5) continue; // maxDepth

      // Get neighbors
      const edgeResults = await this.db.execute(sql`
        SELECT target_id FROM graph_edges WHERE source_id = ? AND company_id = (SELECT company_id FROM graph_nodes WHERE id = ?)
        UNION
        SELECT source_id FROM graph_edges WHERE target_id = ? AND company_id = (SELECT company_id FROM graph_nodes WHERE id = ?)
      `);

      for (const row of this.db.rows) {
        const neighborId = row[0] as string;
        if (!visited.has(neighborId)) {
          queue.push({ nodeId: neighborId, path: [...path, neighborId] });
        }
      }
    }

    return null;
  }

  async getNeighbors(nodeId: string, edgeType?: string): Promise<any[]> {
    let query = `
      SELECT e.*, n.id as neighbor_id, n.type, n.label, n.properties
      FROM graph_edges e
      JOIN graph_nodes n ON (e.source_id = n.id OR e.target_id = n.id)
      WHERE e.company_id = (SELECT company_id FROM graph_nodes WHERE id = ?)
      AND (e.source_id = ? OR e.target_id = ?)
      AND n.id != ?
    `;

    if (edgeType) {
      // Add edge type filter
    }

    return [];
  }
}

export const graphStore = new GraphStore();