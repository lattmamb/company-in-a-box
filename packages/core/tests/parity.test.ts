import { describe, it, expect, beforeAll } from "vitest";
import { initTestDb } from "./helpers";
import { getDatabase } from "../src/db/client";
import { companies, agents } from "../src/db/schema";
import { createApproval, listApprovals, approveApproval, rejectApproval, requestApprovalRevision } from "../src/approvals";
import { listGoals, createGoal, updateGoal } from "../src/goals";
import { ingestEvidence, listEvidence, setEvidenceStatus, getEvidence } from "../src/evidence";
import { createPacket, commitPacketVersion, listPacketVersions, setPacketStatus } from "../src/finance";
import { recordCost, getCostSummary, getDashboard } from "../src/monitoring";
import { recordActivity, listActivity } from "../src/evidence";

let companyId: string;

beforeAll(async () => {
  await initTestDb();
  const db = getDatabase();
  companyId = "parity-company";
  await db.insert(companies).values({ id: companyId, name: "Parity Co", slug: "parity-co" });
  await db.insert(agents).values([
    { id: "pa-1", companyId, name: "Worker", role: "engineer", adapterType: "claude", budgetMonthlyCents: 10000 },
    { id: "pa-2", companyId, name: "Spender", role: "analyst", adapterType: "openai", budgetMonthlyCents: 5000 },
  ]);
});

describe("approvals", () => {
  it("creates and lists pending approvals", async () => {
    const a = await createApproval({
      companyId,
      actionType: "payment",
      title: "Wire $5k to vendor",
      requestedBy: "pa-1",
    });
    expect(a.status).toBe("pending");
    const pending = await listApprovals(companyId, "pending");
    expect(pending.some((x) => x.id === a.id)).toBe(true);
  });

  it("approves a pending request", async () => {
    const a = await createApproval({ companyId, actionType: "contract", title: "Sign NDA", requestedBy: "pa-1" });
    const approved = await approveApproval(a.id, "human-1", "Looks good");
    expect(approved?.status).toBe("approved");
    expect(approved?.decidedBy).toBe("human-1");
    expect(approved?.decisionNote).toBe("Looks good");
  });

  it("rejects a pending request", async () => {
    const a = await createApproval({ companyId, actionType: "payment", title: "Bad spend", requestedBy: "pa-2" });
    const rejected = await rejectApproval(a.id, "human-1", "Over budget");
    expect(rejected?.status).toBe("rejected");
  });

  it("requests revision with required comment", async () => {
    const a = await createApproval({ companyId, actionType: "legal_conclusion", title: "Legal memo", requestedBy: "pa-1" });
    const revised = await requestApprovalRevision(a.id, "human-1", "Add citations to clause 4");
    expect(revised?.status).toBe("revision_requested");
    await expect(requestApprovalRevision(a.id, "human-1", "")).rejects.toThrow("comment is required");
  });

  it("does not decide an already-decided request", async () => {
    const a = await createApproval({ companyId, actionType: "payment", title: "One decision only", requestedBy: "pa-1" });
    await approveApproval(a.id, "human-1");
    const second = await approveApproval(a.id, "human-2");
    expect(second).toBeNull();
  });
});

describe("goals", () => {
  it("creates, lists, updates goals", async () => {
    const g = await createGoal({ companyId, title: "Ship parity by Friday", description: "All Paperclip endpoints live", createdBy: "pa-1" });
    expect(g.status).toBe("active");
    const list = await listGoals(companyId);
    expect(list.some((x) => x.id === g.id)).toBe(true);
    const updated = await updateGoal(g.id, { title: "Ship parity by Thursday" });
    expect(updated?.title).toBe("Ship parity by Thursday");
    const archived = await updateGoal(g.id, { status: "achieved" });
    expect(archived?.status).toBe("achieved");
  });
});

describe("evidence vault", () => {
  it("ingests content-addressed evidence and rejects duplicates", async () => {
    const item = await ingestEvidence({
      companyId,
      title: "Lease agreement",
      kind: "legal",
      content: "LEASE CONTENT v1",
      createdBy: "pa-1",
    });
    expect(item.sha256).toHaveLength(64);
    expect(item.vaultPath).toContain(companyId);
    await expect(
      ingestEvidence({ companyId, title: "Dup", kind: "legal", content: "LEASE CONTENT v1", createdBy: "pa-1" }),
    ).rejects.toThrow();
  });

  it("lists and transitions status", async () => {
    const item = await ingestEvidence({ companyId, title: "Photo", kind: "image", content: "png-bytes", createdBy: "pa-1" });
    const verified = await setEvidenceStatus(item.id, "verified");
    expect(verified?.status).toBe("verified");
    const list = await listEvidence(companyId, { status: "verified" });
    expect(list.some((x) => x.id === item.id)).toBe(true);
    expect((await getEvidence(item.id))?.kind).toBe("image");
  });
});

describe("finance packets", () => {
  it("commits immutable versions and skips duplicate bodies", async () => {
    const packet = await createPacket({ companyId, title: "Q1 NOI", kind: "noi", createdBy: "pa-1" });
    const v1 = await commitPacketVersion({ packetId: packet.id, body: { noi: 100 }, createdBy: "pa-1" });
    expect(v1.version).toBe(1);
    const v2 = await commitPacketVersion({ packetId: packet.id, body: { noi: 120 }, changeSummary: "updated rents", createdBy: "pa-1" });
    expect(v2.version).toBe(2);
    expect(v2.parentSha256).toBe(v1.sha256);
    const dup = await commitPacketVersion({ packetId: packet.id, body: { noi: 120 }, createdBy: "pa-1" });
    expect(dup.version).toBe(2);
    const versions = await listPacketVersions(packet.id);
    expect(versions).toHaveLength(2);
    const archived = await setPacketStatus(packet.id, "archived");
    expect(archived?.status).toBe("archived");
  });
});

describe("monitoring: costs, dashboard, activity", () => {
  it("records costs and summarizes per agent with remaining budget", async () => {
    await recordCost({ companyId, agentId: "pa-1", provider: "anthropic", model: "claude-sonnet", inputTokens: 1000, outputTokens: 500, costCents: 150 });
    await recordCost({ companyId, agentId: "pa-2", provider: "openai", model: "gpt-5", inputTokens: 2000, outputTokens: 100, costCents: 300 });
    const summary = await getCostSummary(companyId);
    expect(summary.totalCostCents).toBe(450);
    expect(summary.remainingBudgetCents).toBe(15000 - 450);
    const spender = summary.byAgent.find((a) => a.agentId === "pa-2");
    expect(spender?.costCents).toBe(300);
  });

  it("builds the dashboard", async () => {
    await createGoal({ companyId, title: "dash", createdBy: "pa-1" });
    const dash = await getDashboard(companyId);
    expect(dash.agentCount).toBe(2);
    expect(typeof dash.openIssues).toBe("number");
    expect(dash.recentActivity.length).toBeLessThanOrEqual(10);
    expect(dash.periodCostCents).toBeGreaterThan(0);
  });

  it("records and lists activity with agent filter", async () => {
    await recordActivity({ companyId, actorType: "agent", actorId: "pa-1", action: "issue.created", entityType: "issue", entityId: "x1" });
    await recordActivity({ companyId, actorType: "agent", actorId: "pa-2", action: "evidence.ingested", entityType: "evidence", entityId: "x2" });
    const all = await listActivity(companyId, { limit: 10 });
    expect(all.length).toBeGreaterThanOrEqual(2);
    const onlyA = await listActivity(companyId, { agentId: "pa-1" });
    expect(onlyA.every((a) => a.actorId === "pa-1")).toBe(true);
  });
});
