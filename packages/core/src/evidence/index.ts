import { createHash } from "crypto";
import { getDatabase } from "../db/client";
import { evidenceItems, sources, citations, auditEvents, activityLog, type EvidenceItem } from "../db/schema";
import { and, desc, eq } from "drizzle-orm";
import { ulid } from "ulid";

export interface IngestEvidenceInput {
  companyId: string;
  title: string;
  kind: EvidenceItem["kind"];
  description?: string;
  fileName?: string;
  content: Buffer | string;
  tags?: string[];
  source?: EvidenceItem["source"];
  createdBy: string;
}

/**
 * Ingest an evidence item: content-addressed by sha256, stored under the
 * company's vault path. Identical content is rejected (unique sha256).
 */
export async function ingestEvidence(input: IngestEvidenceInput): Promise<EvidenceItem> {
  const db = getDatabase();
  const sha256 = createHash("sha256").update(input.content).digest("hex");
  const item = {
    id: ulid(),
    companyId: input.companyId,
    title: input.title,
    kind: input.kind,
    description: input.description,
    fileName: input.fileName,
    sha256,
    vaultPath: `vault/${input.companyId}/${sha256}`,
    tags: input.tags || [],
    source: input.source || "upload",
    createdBy: input.createdBy,
  };
  await db.insert(evidenceItems).values(item);
  return (await db.select().from(evidenceItems).where(eq(evidenceItems.id, item.id)).limit(1))[0];
}

export async function listEvidence(companyId: string, options: { status?: EvidenceItem["status"]; kind?: EvidenceItem["kind"] } = {}): Promise<EvidenceItem[]> {
  const db = getDatabase();
  const conditions = [eq(evidenceItems.companyId, companyId)];
  if (options.status) conditions.push(eq(evidenceItems.status, options.status));
  if (options.kind) conditions.push(eq(evidenceItems.kind, options.kind));
  return db
    .select()
    .from(evidenceItems)
    .where(and(...conditions))
    .orderBy(desc(evidenceItems.createdAt));
}

export async function getEvidence(evidenceId: string): Promise<EvidenceItem | null> {
  const db = getDatabase();
  const rows = await db.select().from(evidenceItems).where(eq(evidenceItems.id, evidenceId)).limit(1);
  return rows[0] ?? null;
}

export async function setEvidenceStatus(evidenceId: string, status: EvidenceItem["status"]): Promise<EvidenceItem | null> {
  const db = getDatabase();
  const updated = await db
    .update(evidenceItems)
    .set({ status, updatedAt: new Date() })
    .where(eq(evidenceItems.id, evidenceId))
    .returning();
  return updated[0] ?? null;
}

export async function addSource(companyId: string, input: {
  title: string;
  kind: typeof sources.$inferInsert.kind;
  url?: string;
  citation?: string;
  authority?: string;
  notes?: string;
}) {
  const db = getDatabase();
  const source = { id: ulid(), companyId, ...input };
  await db.insert(sources).values(source);
  return (await db.select().from(sources).where(eq(sources.id, source.id)).limit(1))[0];
}

export async function addCitation(companyId: string, input: { evidenceId: string; sourceId: string; note?: string }) {
  const db = getDatabase();
  const citation = { id: ulid(), companyId, ...input };
  await db.insert(citations).values(citation);
  return (await db.select().from(citations).where(eq(citations.id, citation.id)).limit(1))[0];
}

// ============================================================================
// AUDIT + ACTIVITY (shared helpers used by all services)
// ============================================================================

export interface AuditInput {
  companyId: string;
  entityType: string;
  entityId: string;
  action: string;
  actorType: "user" | "agent" | "system";
  actorId: string;
  role?: string;
  reason?: string;
  detail?: Record<string, unknown>;
}

export async function recordAuditEvent(input: AuditInput) {
  const db = getDatabase();
  const event = { id: ulid(), ...input };
  await db.insert(auditEvents).values(event);
  return event;
}

export interface ActivityInput {
  companyId: string;
  actorType: "user" | "agent" | "system";
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  meta?: Record<string, unknown>;
}

export async function recordActivity(input: ActivityInput) {
  const db = getDatabase();
  const entry = { id: ulid(), ...input };
  await db.insert(activityLog).values(entry);
  return entry;
}

export async function listActivity(companyId: string, options: { agentId?: string; limit?: number } = {}) {
  const db = getDatabase();
  const conditions = [eq(activityLog.companyId, companyId)];
  if (options.agentId) conditions.push(eq(activityLog.actorId, options.agentId));
  return db
    .select()
    .from(activityLog)
    .where(and(...conditions))
    .orderBy(desc(activityLog.createdAt))
    .limit(Math.min(options.limit ?? 20, 100));
}
