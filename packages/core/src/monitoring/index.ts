import { getDatabase } from "../db/client";
import { costEntries, agents, issues, activityLog, type CostEntry } from "../db/schema";
import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { ulid } from "ulid";

export interface RecordCostInput {
  companyId: string;
  agentId?: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costCents: number;
}

export async function recordCost(input: RecordCostInput): Promise<CostEntry> {
  const db = getDatabase();
  const entry = { id: ulid(), ...input };
  await db.insert(costEntries).values(entry);
  return (await db.select().from(costEntries).where(eq(costEntries.id, entry.id)).limit(1))[0];
}

export interface CostSummary {
  totalCostCents: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  remainingBudgetCents: number | null;
  byAgent: Array<{ agentId: string | null; agentName: string | null; costCents: number; inputTokens: number; outputTokens: number }>;
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Aggregate spend for the current calendar-month billing period, with a
 * per-agent breakdown and remaining budget (sum of agent monthly budgets).
 */
export async function getCostSummary(companyId: string): Promise<CostSummary> {
  const db = getDatabase();
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const rows = await db
    .select({
      agentId: costEntries.agentId,
      agentName: agents.name,
      costCents: sql<number>`COALESCE(SUM(${costEntries.costCents}), 0)`,
      inputTokens: sql<number>`COALESCE(SUM(${costEntries.inputTokens}), 0)`,
      outputTokens: sql<number>`COALESCE(SUM(${costEntries.outputTokens}), 0)`,
    })
    .from(costEntries)
    .leftJoin(agents, eq(costEntries.agentId, agents.id))
    .where(and(eq(costEntries.companyId, companyId), gte(costEntries.createdAt, periodStart)))
    .groupBy(costEntries.agentId, agents.name);

  const byAgent = rows.map((r) => ({
    agentId: r.agentId,
    agentName: r.agentName ?? null,
    costCents: Number(r.costCents),
    inputTokens: Number(r.inputTokens),
    outputTokens: Number(r.outputTokens),
  }));

  const budgetRows = await db
    .select({ budget: sql<number>`COALESCE(SUM(${agents.budgetMonthlyCents}), 0)` })
    .from(agents)
    .where(eq(agents.companyId, companyId));

  const totalCostCents = byAgent.reduce((s, a) => s + a.costCents, 0);
  const budgetCents = Number(budgetRows[0]?.budget ?? 0);

  return {
    totalCostCents,
    totalInputTokens: byAgent.reduce((s, a) => s + a.inputTokens, 0),
    totalOutputTokens: byAgent.reduce((s, a) => s + a.outputTokens, 0),
    remainingBudgetCents: budgetCents > 0 ? budgetCents - totalCostCents : null,
    byAgent,
    periodStart,
    periodEnd: now,
  };
}

export interface Dashboard {
  agentCount: number;
  openIssues: number;
  inProgressIssues: number;
  blockedIssues: number;
  staleIssues: number;
  recentActivity: Array<{ id: string; action: string; entityType: string; entityId: string; actorId: string; createdAt: Date }>;
  periodCostCents: number;
}

/**
 * Company health summary: agent count, issue counts by state, stale tasks
 * (in_progress with no update in 7 days), recent activity, current-period cost.
 */
export async function getDashboard(companyId: string): Promise<Dashboard> {
  const db = getDatabase();
  const staleCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const statusRows = await db
    .select({ status: issues.status, n: count() })
    .from(issues)
    .where(eq(issues.companyId, companyId))
    .groupBy(issues.status);

  const byStatus = Object.fromEntries(statusRows.map((r) => [r.status, Number(r.n)]));

  const staleRows = await db
    .select({ n: count() })
    .from(issues)
    .where(
      and(
        eq(issues.companyId, companyId),
        eq(issues.status, "in_progress"),
        sql`${issues.updatedAt} < ${staleCutoff}`,
      ),
    );

  const agentRows = await db
    .select({ n: count() })
    .from(agents)
    .where(eq(agents.companyId, companyId));

  const recent = await db
    .select()
    .from(activityLog)
    .where(eq(activityLog.companyId, companyId))
    .orderBy(desc(activityLog.createdAt))
    .limit(10);

  const summary = await getCostSummary(companyId);

  return {
    agentCount: Number(agentRows[0]?.n ?? 0),
    openIssues: (byStatus["todo"] ?? 0) + (byStatus["backlog"] ?? 0),
    inProgressIssues: byStatus["in_progress"] ?? 0,
    blockedIssues: byStatus["blocked"] ?? 0,
    staleIssues: Number(staleRows[0]?.n ?? 0),
    recentActivity: recent.map((a) => ({
      id: a.id,
      action: a.action,
      entityType: a.entityType,
      entityId: a.entityId,
      actorId: a.actorId,
      createdAt: a.createdAt,
    })),
    periodCostCents: summary.totalCostCents,
  };
}
