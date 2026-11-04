import { getDatabase } from "../db/client";
import { issues, issueComments, projects, type Issue, type IssueComment } from "../db/schema";
import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { ulid } from "ulid";

export interface CreateIssueInput {
  companyId: string;
  title: string;
  description?: string;
  assigneeAgentId?: string;
  projectId?: string;
  parentIssueId?: string;
  priority?: "low" | "medium" | "high" | "critical" | "urgent";
  reporterId: string;
  labels?: string[];
  goalId?: string;
}

export interface UpdateIssueInput {
  title?: string;
  description?: string;
  status?: "backlog" | "todo" | "in_progress" | "review" | "blocked" | "done" | "cancelled";
  assigneeAgentId?: string | null;
  priority?: "low" | "medium" | "high" | "critical" | "urgent";
}

const CLOSED_STATUSES = ["done", "cancelled"] as const;

async function nextIdentifier(companyId: string): Promise<string> {
  const db = getDatabase();
  const rows = await db
    .select({ identifier: issues.identifier })
    .from(issues)
    .where(eq(issues.companyId, companyId));
  let max = 0;
  for (const r of rows) {
    const n = parseInt(r.identifier.split("-").pop() || "0", 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  // Prefix from the company's first project slug, else generic "TSK"
  const project = await db.select().from(projects).where(eq(projects.companyId, companyId)).limit(1);
  const prefix = (project[0]?.slug || "TSK").slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "") || "TSK";
  return `${prefix}-${max + 1}`;
}

export async function listIssues(
  companyId: string,
  options: {
    status?: string[];
    assigneeAgentId?: string;
    projectId?: string;
    label?: string;
    limit?: number;
  } = {},
): Promise<Issue[]> {
  const db = getDatabase();
  const conditions = [eq(issues.companyId, companyId)];
  if (options.status?.length) conditions.push(inArray(issues.status, options.status as Issue["status"][]));
  if (options.assigneeAgentId) conditions.push(eq(issues.assigneeAgentId, options.assigneeAgentId));
  if (options.projectId) conditions.push(eq(issues.projectId, options.projectId));
  if (options.label) conditions.push(sql`${issues.labels} LIKE ${`%"${options.label}"%`}`);
  return db
    .select()
    .from(issues)
    .where(and(...conditions))
    .orderBy(desc(issues.createdAt))
    .limit(Math.min(options.limit ?? 50, 200));
}

export async function getIssue(issueIdOrIdentifier: string): Promise<Issue | null> {
  const db = getDatabase();
  const byId = await db.select().from(issues).where(eq(issues.id, issueIdOrIdentifier)).limit(1);
  if (byId[0]) return byId[0];
  // Fall back to human-readable identifier (e.g. "ENG-42") — unique per company,
  // so scan for a match rather than guessing the company.
  const byIdentifier = await db
    .select()
    .from(issues)
    .where(eq(issues.identifier, issueIdOrIdentifier))
    .limit(1);
  return byIdentifier[0] ?? null;
}

export async function createIssue(input: CreateIssueInput): Promise<Issue> {
  const db = getDatabase();
  const issue = {
    id: ulid(),
    companyId: input.companyId,
    projectId: input.projectId || null,
    identifier: await nextIdentifier(input.companyId),
    title: input.title,
    description: input.description,
    status: (input.assigneeAgentId ? "todo" : "backlog") as Issue["status"],
    priority: (input.priority || "medium") as Issue["priority"],
    assigneeAgentId: input.assigneeAgentId || null,
    reporterId: input.reporterId,
    parentId: input.parentIssueId || null,
    goalId: input.goalId || null,
    labels: input.labels || [],
  };
  await db.insert(issues).values(issue);
  return (await db.select().from(issues).where(eq(issues.id, issue.id)).limit(1))[0];
}

export async function updateIssue(issueId: string, input: UpdateIssueInput): Promise<Issue | null> {
  const db = getDatabase();
  const patch: Partial<typeof issues.$inferInsert> = { updatedAt: new Date() };
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.status !== undefined) {
    patch.status = input.status;
    if (CLOSED_STATUSES.includes(input.status as (typeof CLOSED_STATUSES)[number])) {
      patch.completedAt = new Date();
    }
  }
  if (input.assigneeAgentId !== undefined) patch.assigneeAgentId = input.assigneeAgentId;
  if (input.priority !== undefined) patch.priority = input.priority;

  const updated = await db.update(issues).set(patch).where(eq(issues.id, issueId)).returning();
  return updated[0] ?? null;
}

export interface CheckoutResult {
  issue: Issue;
  conflict: boolean;
}

/**
 * Atomically claim an issue for an agent: sets assignee, moves to in_progress,
 * and stamps the execution lock. If another agent already owns it, returns
 * conflict: true (the API layer maps this to 409).
 */
export async function checkoutIssue(issueId: string, agentId: string): Promise<CheckoutResult> {
  const db = getDatabase();
  const updated = await db
    .update(issues)
    .set({
      assigneeAgentId: agentId,
      status: "in_progress",
      executionAgentNameKey: agentId,
      executionLockedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(issues.id, issueId),
        or(isNull(issues.assigneeAgentId), eq(issues.assigneeAgentId, agentId)),
        // Closed issues cannot be checked out
        notInClosed(),
      ),
    )
    .returning();
  if (updated[0]) return { issue: updated[0], conflict: false };
  // Distinguish "already claimed by someone else" from "not found / closed"
  const existing = await getIssue(issueId);
  if (!existing) throw new Error("Issue not found");
  return { issue: existing, conflict: true };
}

function notInClosed() {
  return sql`${issues.status} NOT IN ('done', 'cancelled')`;
}

/**
 * Release a checked-out issue: unassign and revert to todo.
 */
export async function releaseIssue(issueId: string, agentId: string): Promise<Issue | null> {
  const db = getDatabase();
  const updated = await db
    .update(issues)
    .set({
      assigneeAgentId: null,
      status: "todo",
      executionAgentNameKey: null,
      executionLockedAt: null,
      updatedAt: new Date(),
    })
    .where(and(eq(issues.id, issueId), eq(issues.assigneeAgentId, agentId)))
    .returning();
  return updated[0] ?? null;
}

export async function commentOnIssue(
  issueId: string,
  input: { companyId: string; authorType: "user" | "agent" | "system"; authorId: string; body: string; reopen?: boolean },
): Promise<IssueComment | null> {
  const db = getDatabase();
  const issue = await getIssue(issueId);
  if (!issue) return null;

  const commentId = ulid();
  await db.insert(issueComments).values({
    id: commentId,
    companyId: input.companyId,
    issueId: issue.id,
    authorType: input.authorType,
    authorId: input.authorId,
    body: input.body,
  });

  if (input.reopen && CLOSED_STATUSES.includes(issue.status as (typeof CLOSED_STATUSES)[number])) {
    await db
      .update(issues)
      .set({ status: "todo", completedAt: null, updatedAt: new Date() })
      .where(eq(issues.id, issue.id));
  }

  return {
    id: commentId,
    companyId: input.companyId,
    issueId: issue.id,
    authorType: input.authorType,
    authorId: input.authorId,
    body: input.body,
    createdAt: new Date(),
  };
}

export async function listIssueComments(issueId: string): Promise<IssueComment[]> {
  const db = getDatabase();
  const rows = await db
    .select()
    .from(issueComments)
    .where(eq(issueComments.issueId, issueId))
    .orderBy(issueComments.createdAt);
  return rows as IssueComment[];
}

export async function deleteIssue(issueId: string): Promise<boolean> {
  const db = getDatabase();
  const deleted = (await db.delete(issues).where(eq(issues.id, issueId)).returning()) as unknown[];
  return deleted.length > 0;
}

export type { Issue };
