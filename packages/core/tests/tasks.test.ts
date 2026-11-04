import { describe, it, expect, beforeAll } from "vitest";
import { initTestDb } from "./helpers";
import { getDatabase } from "../src/db/client";
import { companies, agents, issues } from "../src/db/schema";
import {
  createIssue,
  listIssues,
  getIssue,
  updateIssue,
  checkoutIssue,
  releaseIssue,
  commentOnIssue,
  listIssueComments,
  deleteIssue,
} from "../src/tasks";
import { eq } from "drizzle-orm";

let companyId: string;
let agentAId: string;
let agentBId: string;

beforeAll(async () => {
  await initTestDb();
  const db = getDatabase();
  companyId = "test-company";
  agentAId = "agent-a";
  agentBId = "agent-b";
  await db.insert(companies).values({ id: companyId, name: "Test Co", slug: "test-co" });
  await db.insert(agents).values([
    { id: agentAId, companyId, name: "Agent A", role: "engineer", adapterType: "claude" },
    { id: agentBId, companyId, name: "Agent B", role: "engineer", adapterType: "claude" },
  ]);
});

describe("tasks/issues", () => {
  it("creates an issue with a sequential identifier", async () => {
    const a = await createIssue({ companyId, title: "First task", reporterId: "user-1" });
    const b = await createIssue({ companyId, title: "Second task", priority: "urgent", reporterId: "user-1" });
    expect(a.identifier).toMatch(/^[A-Z]+-\d+$/);
    expect(parseInt(b.identifier.split("-")[1], 10)).toBe(parseInt(a.identifier.split("-")[1], 10) + 1);
    expect(b.priority).toBe("urgent");
    expect(a.status).toBe("backlog");
  });

  it("creates an assigned issue in todo status", async () => {
    const issue = await createIssue({ companyId, title: "Assigned", assigneeAgentId: agentAId, reporterId: "user-1" });
    expect(issue.status).toBe("todo");
    expect(issue.assigneeAgentId).toBe(agentAId);
  });

  it("lists issues with filters", async () => {
    const all = await listIssues(companyId);
    expect(all.length).toBeGreaterThanOrEqual(3);
    const urgent = await listIssues(companyId, { status: ["todo"] });
    expect(urgent.every((i) => i.status === "todo")).toBe(true);
    const byAgent = await listIssues(companyId, { assigneeAgentId: agentAId });
    expect(byAgent.every((i) => i.assigneeAgentId === agentAId)).toBe(true);
  });

  it("gets by UUID and by identifier", async () => {
    const created = await createIssue({ companyId, title: "Lookup me", reporterId: "user-1" });
    const byId = await getIssue(created.id);
    const byIdentifier = await getIssue(created.identifier);
    expect(byId?.id).toBe(created.id);
    expect(byIdentifier?.id).toBe(created.id);
  });

  it("updates fields and stamps completedAt on close", async () => {
    const created = await createIssue({ companyId, title: "Update me", reporterId: "user-1" });
    const updated = await updateIssue(created.id, { status: "done", priority: "high" });
    expect(updated?.status).toBe("done");
    expect(updated?.priority).toBe("high");
    expect(updated?.completedAt).toBeTruthy();
  });

  it("checks out an issue atomically and conflicts on second agent", async () => {
    const created = await createIssue({ companyId, title: "Checkout race", reporterId: "user-1" });
    const first = await checkoutIssue(created.id, agentAId);
    expect(first.conflict).toBe(false);
    expect(first.issue.status).toBe("in_progress");
    expect(first.issue.assigneeAgentId).toBe(agentAId);

    const second = await checkoutIssue(created.id, agentBId);
    expect(second.conflict).toBe(true);
    expect(second.issue.assigneeAgentId).toBe(agentAId);
  });

  it("re-checkout by the same agent is not a conflict", async () => {
    const created = await createIssue({ companyId, title: "Recheckout", reporterId: "user-1" });
    await checkoutIssue(created.id, agentAId);
    const again = await checkoutIssue(created.id, agentAId);
    expect(again.conflict).toBe(false);
  });

  it("releases an issue back to todo and clears the lock", async () => {
    const created = await createIssue({ companyId, title: "Release me", reporterId: "user-1" });
    await checkoutIssue(created.id, agentAId);
    const released = await releaseIssue(created.id, agentAId);
    expect(released?.status).toBe("todo");
    expect(released?.assigneeAgentId).toBeNull();
    expect(released?.executionLockedAt).toBeNull();
  });

  it("only the owning agent can release", async () => {
    const created = await createIssue({ companyId, title: "Wrong releaser", reporterId: "user-1" });
    await checkoutIssue(created.id, agentAId);
    const wrong = await releaseIssue(created.id, agentBId);
    expect(wrong).toBeNull();
  });

  it("comments on an issue and reopens closed issues", async () => {
    const created = await createIssue({ companyId, title: "Comment target", reporterId: "user-1" });
    await updateIssue(created.id, { status: "done" });
    const comment = await commentOnIssue(created.id, {
      companyId,
      authorType: "agent",
      authorId: agentAId,
      body: "Reopening: found a regression",
      reopen: true,
    });
    expect(comment?.body).toContain("regression");
    const reopened = await getIssue(created.id);
    expect(reopened?.status).toBe("todo");
    expect(reopened?.completedAt).toBeNull();
    const comments = await listIssueComments(created.id);
    expect(comments.length).toBe(1);
  });

  it("deletes an issue", async () => {
    const created = await createIssue({ companyId, title: "Delete me", reporterId: "user-1" });
    expect(await deleteIssue(created.id)).toBe(true);
    expect(await getIssue(created.id)).toBeNull();
    expect(await deleteIssue(created.id)).toBe(false);
  });
});
