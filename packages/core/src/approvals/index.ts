import { getDatabase } from "../db/client";
import { approvalRequests, type ApprovalRequest } from "../db/schema";
import { and, desc, eq } from "drizzle-orm";
import { ulid } from "ulid";

export type ApprovalStatus = "pending" | "approved" | "blocked" | "expired" | "rejected" | "revision_requested";

export interface CreateApprovalInput {
  companyId: string;
  actionType: ApprovalRequest["actionType"];
  title: string;
  description?: string;
  requestedBy: string;
  payload?: Record<string, unknown>;
}

export async function listApprovals(companyId: string, status: ApprovalStatus = "pending"): Promise<ApprovalRequest[]> {
  const db = getDatabase();
  return db
    .select()
    .from(approvalRequests)
    .where(and(eq(approvalRequests.companyId, companyId), eq(approvalRequests.status, status)))
    .orderBy(desc(approvalRequests.createdAt));
}

export async function createApproval(input: CreateApprovalInput): Promise<ApprovalRequest> {
  const db = getDatabase();
  const approval = {
    id: ulid(),
    companyId: input.companyId,
    actionType: input.actionType,
    title: input.title,
    description: input.description,
    requestedBy: input.requestedBy,
    payload: input.payload || {},
  };
  await db.insert(approvalRequests).values(approval);
  return (await db.select().from(approvalRequests).where(eq(approvalRequests.id, approval.id)).limit(1))[0];
}

export async function approveApproval(approvalId: string, decidedBy: string, comment?: string): Promise<ApprovalRequest | null> {
  const db = getDatabase();
  const result = await db
    .update(approvalRequests)
    .set({
      status: "approved",
      decidedBy,
      decisionNote: comment,
      decidedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(approvalRequests.id, approvalId), eq(approvalRequests.status, "pending")))
    .returning();
  return result[0] ?? null;
}

export async function rejectApproval(approvalId: string, decidedBy: string, comment?: string): Promise<ApprovalRequest | null> {
  const db = getDatabase();
  const result = await db
    .update(approvalRequests)
    .set({
      status: "rejected",
      decidedBy,
      decisionNote: comment,
      decidedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(approvalRequests.id, approvalId), eq(approvalRequests.status, "pending")))
    .returning();
  return result[0] ?? null;
}

export async function requestApprovalRevision(approvalId: string, decidedBy: string, comment: string): Promise<ApprovalRequest | null> {
  if (!comment.trim()) throw new Error("A comment is required when requesting a revision");
  const db = getDatabase();
  const result = await db
    .update(approvalRequests)
    .set({
      status: "revision_requested",
      decidedBy,
      decisionNote: comment,
      decidedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(approvalRequests.id, approvalId), eq(approvalRequests.status, "pending")))
    .returning();
  return result[0] ?? null;
}
