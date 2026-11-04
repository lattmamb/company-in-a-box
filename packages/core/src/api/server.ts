import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { createHash } from "crypto";
import { validateAgentApiKey, getAgent, invokeAgentHeartbeat, listAgents } from "../agents";
import {
  listIssues,
  getIssue,
  createIssue,
  updateIssue,
  checkoutIssue,
  releaseIssue,
  commentOnIssue,
  listIssueComments,
  deleteIssue,
} from "../tasks";
import { listApprovals, approveApproval, rejectApproval, requestApprovalRevision, createApproval } from "../approvals";
import { listGoals, createGoal, updateGoal } from "../goals";
import { ingestEvidence, listEvidence, getEvidence, setEvidenceStatus, listActivity, recordActivity } from "../evidence";
import { createPacket, listPackets, getPacket, commitPacketVersion, listPacketVersions, setPacketStatus } from "../finance";
import { getCostSummary, getDashboard, recordCost } from "../monitoring";
import type { Agent } from "../db/schema";

/**
 * REST API server exposing the Paperclip-parity surface on :3100.
 * The frontend dev server proxies /api here; paperclip-mcp-compatible
 * clients point PAPERCLIP_BASE_URL at http://localhost:3100/api.
 *
 * Auth: Agent API keys (created via createAgentApiKey). Send
 * `Authorization: Bearer cib_...`. The key resolves to the calling agent
 * and its company; company-scoped routes are implicitly scoped to it.
 */

interface AuthContext {
  Variables: {
    agent: Agent;
  };
}

const app = new Hono<AuthContext>();

// ── Auth middleware ──────────────────────────────────────────────────────────

app.use("/api/*", async (c, next) => {
  if (c.req.path === "/api/health") return next();
  const header = c.req.header("authorization") || c.req.header("x-api-key") || "";
  const raw = header.startsWith("Bearer ") ? header.slice(7) : header;
  if (!raw.startsWith("cib_")) {
    return c.json({ error: "Missing or invalid API key" }, 401);
  }
  const keyPrefix = raw.slice(0, 12);
  const keyHash = createHash("sha256").update(raw).digest("hex");
  const keyRecord = await validateAgentApiKey(keyPrefix, keyHash);
  if (!keyRecord) {
    return c.json({ error: "Invalid API key" }, 401);
  }
  const agent = await getAgent(keyRecord.agentId);
  if (!agent) {
    return c.json({ error: "Agent not found for API key" }, 401);
  }
  c.set("agent", agent);
  await next();
});

const agentId = (c: any) => c.get("agent").id as string;
const companyId = (c: any) => c.get("agent").companyId as string;

// ── ISSUES ───────────────────────────────────────────────────────────────────

app.get("/api/companies/:companyId/issues", async (c) => {
  const q = c.req.query();
  const issues = await listIssues(companyId(c), {
    status: q.status?.split(",").filter(Boolean),
    assigneeAgentId: q.assigneeAgentId || undefined,
    projectId: q.projectId || undefined,
    label: q.label || undefined,
    limit: q.limit ? parseInt(q.limit, 10) : 50,
  });
  return c.json({ issues });
});

app.post("/api/companies/:companyId/issues", async (c) => {
  const body = await c.req.json();
  if (!body.title) return c.json({ error: "title is required" }, 400);
  const issue = await createIssue({
    companyId: companyId(c),
    title: body.title,
    description: body.description,
    assigneeAgentId: body.assigneeAgentId,
    projectId: body.projectId,
    parentIssueId: body.parentIssueId,
    priority: body.priority,
    reporterId: agentId(c),
    labels: body.labels,
    goalId: body.goalId,
  });
  await recordActivity({
    companyId: companyId(c),
    actorType: "agent",
    actorId: agentId(c),
    action: "issue.created",
    entityType: "issue",
    entityId: issue.id,
  });
  return c.json({ issue }, 201);
});

app.get("/api/issues/:id", async (c) => {
  const issue = await getIssue(c.req.param("id"));
  if (!issue) return c.json({ error: "Issue not found" }, 404);
  const comments = await listIssueComments(issue.id);
  return c.json({ issue, comments });
});

app.patch("/api/issues/:id", async (c) => {
  const body = await c.req.json();
  const issue = await updateIssue(c.req.param("id"), body);
  if (!issue) return c.json({ error: "Issue not found" }, 404);
  return c.json({ issue });
});

app.delete("/api/issues/:id", async (c) => {
  const ok = await deleteIssue(c.req.param("id"));
  if (!ok) return c.json({ error: "Issue not found" }, 404);
  return c.json({ success: true });
});

app.post("/api/issues/:id/checkout", async (c) => {
  try {
    const result = await checkoutIssue(c.req.param("id"), agentId(c));
    if (result.conflict) return c.json({ error: "Issue already checked out by another agent" }, 409);
    return c.json({ issue: result.issue });
  } catch (e: any) {
    if (e.message === "Issue not found") return c.json({ error: e.message }, 404);
    throw e;
  }
});

app.post("/api/issues/:id/release", async (c) => {
  const issue = await releaseIssue(c.req.param("id"), agentId(c));
  if (!issue) return c.json({ error: "Issue not checked out by this agent" }, 409);
  return c.json({ issue });
});

app.post("/api/issues/:id/comments", async (c) => {
  const body = await c.req.json();
  if (!body.body) return c.json({ error: "body is required" }, 400);
  const comment = await commentOnIssue(c.req.param("id"), {
    companyId: companyId(c),
    authorType: "agent",
    authorId: agentId(c),
    body: body.body,
    reopen: body.reopen === true,
  });
  if (!comment) return c.json({ error: "Issue not found" }, 404);
  return c.json({ comment }, 201);
});

// ── AGENTS ───────────────────────────────────────────────────────────────────

app.get("/api/agents/me", async (c) => {
  return c.json({ agent: c.get("agent") });
});

app.get("/api/agents/:id", async (c) => {
  const agent = await getAgent(c.req.param("id"));
  if (!agent) return c.json({ error: "Agent not found" }, 404);
  return c.json({ agent });
});

app.get("/api/companies/:companyId/agents", async (c) => {
  const agents = await listAgents(companyId(c), {
    status: c.req.query("status"),
    role: c.req.query("role"),
  });
  return c.json({ agents });
});

app.post("/api/agents/:id/heartbeat/invoke", async (c) => {
  const agent = await invokeAgentHeartbeat(c.req.param("id"));
  if (!agent) return c.json({ error: "Agent not found" }, 404);
  return c.json({ agent, heartbeatAt: agent.lastHeartbeatAt });
});

// ── GOALS ────────────────────────────────────────────────────────────────────

app.get("/api/companies/:companyId/goals", async (c) => {
  return c.json({ goals: await listGoals(companyId(c)) });
});

app.post("/api/companies/:companyId/goals", async (c) => {
  const body = await c.req.json();
  if (!body.title) return c.json({ error: "title is required" }, 400);
  const goal = await createGoal({
    companyId: companyId(c),
    title: body.title,
    description: body.description,
    createdBy: agentId(c),
  });
  return c.json({ goal }, 201);
});

app.patch("/api/goals/:id", async (c) => {
  const body = await c.req.json();
  const goal = await updateGoal(c.req.param("id"), body);
  if (!goal) return c.json({ error: "Goal not found" }, 404);
  return c.json({ goal });
});

// ── APPROVALS ────────────────────────────────────────────────────────────────

app.get("/api/companies/:companyId/approvals", async (c) => {
  const status = c.req.query("status") || "pending";
  const allowed = ["pending", "approved", "rejected", "revision_requested", "blocked", "expired"];
  if (!allowed.includes(status)) return c.json({ error: `Invalid status '${status}'` }, 400);
  return c.json({ approvals: await listApprovals(companyId(c), status as any) });
});

app.post("/api/companies/:companyId/approvals", async (c) => {
  const body = await c.req.json();
  if (!body.title || !body.actionType) return c.json({ error: "title and actionType are required" }, 400);
  const approval = await createApproval({
    companyId: companyId(c),
    actionType: body.actionType,
    title: body.title,
    description: body.description,
    requestedBy: agentId(c),
    payload: body.payload,
  });
  return c.json({ approval }, 201);
});

app.post("/api/approvals/:id/approve", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const approval = await approveApproval(c.req.param("id"), agentId(c), body.comment);
  if (!approval) return c.json({ error: "Approval not found or not pending" }, 409);
  return c.json({ approval });
});

app.post("/api/approvals/:id/reject", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const approval = await rejectApproval(c.req.param("id"), agentId(c), body.comment);
  if (!approval) return c.json({ error: "Approval not found or not pending" }, 409);
  return c.json({ approval });
});

app.post("/api/approvals/:id/request-revision", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  if (!body.comment?.trim()) return c.json({ error: "A comment is required when requesting a revision" }, 400);
  const approval = await requestApprovalRevision(c.req.param("id"), agentId(c), body.comment);
  if (!approval) return c.json({ error: "Approval not found or not pending" }, 409);
  return c.json({ approval });
});

// ── COSTS & MONITORING ───────────────────────────────────────────────────────

app.get("/api/companies/:companyId/costs/summary", async (c) => {
  return c.json(await getCostSummary(companyId(c)));
});

app.post("/api/companies/:companyId/costs", async (c) => {
  const body = await c.req.json();
  const entry = await recordCost({
    companyId: companyId(c),
    agentId: body.agentId || agentId(c),
    provider: body.provider,
    model: body.model,
    inputTokens: body.inputTokens || 0,
    outputTokens: body.outputTokens || 0,
    costCents: body.costCents || 0,
  });
  return c.json({ entry }, 201);
});

app.get("/api/companies/:companyId/dashboard", async (c) => {
  return c.json(await getDashboard(companyId(c)));
});

app.get("/api/companies/:companyId/activity", async (c) => {
  const q = c.req.query();
  const activity = await listActivity(companyId(c), {
    agentId: q.agentId || undefined,
    limit: q.limit ? parseInt(q.limit, 10) : 20,
  });
  return c.json({ activity });
});

// ── EVIDENCE VAULT ───────────────────────────────────────────────────────────

app.get("/api/companies/:companyId/evidence", async (c) => {
  const items = await listEvidence(companyId(c), {
    status: (c.req.query("status") as any) || undefined,
    kind: (c.req.query("kind") as any) || undefined,
  });
  return c.json({ items });
});

app.post("/api/companies/:companyId/evidence", async (c) => {
  const body = await c.req.json();
  if (!body.title || !body.kind || body.content === undefined) {
    return c.json({ error: "title, kind and content are required" }, 400);
  }
  const item = await ingestEvidence({
    companyId: companyId(c),
    title: body.title,
    kind: body.kind,
    description: body.description,
    fileName: body.fileName,
    content: body.content,
    tags: body.tags,
    source: body.source,
    createdBy: agentId(c),
  });
  return c.json({ item }, 201);
});

app.get("/api/evidence/:id", async (c) => {
  const item = await getEvidence(c.req.param("id"));
  if (!item) return c.json({ error: "Evidence not found" }, 404);
  return c.json({ item });
});

app.patch("/api/evidence/:id", async (c) => {
  const body = await c.req.json();
  if (!body.status) return c.json({ error: "status is required" }, 400);
  const item = await setEvidenceStatus(c.req.param("id"), body.status);
  if (!item) return c.json({ error: "Evidence not found" }, 404);
  return c.json({ item });
});

// ── FINANCE PACKETS ──────────────────────────────────────────────────────────

app.get("/api/companies/:companyId/finance-packets", async (c) => {
  return c.json({ packets: await listPackets(companyId(c)) });
});

app.post("/api/companies/:companyId/finance-packets", async (c) => {
  const body = await c.req.json();
  if (!body.title || !body.kind) return c.json({ error: "title and kind are required" }, 400);
  const packet = await createPacket({
    companyId: companyId(c),
    title: body.title,
    kind: body.kind,
    createdBy: agentId(c),
  });
  return c.json({ packet }, 201);
});

app.get("/api/finance-packets/:id", async (c) => {
  const packet = await getPacket(c.req.param("id"));
  if (!packet) return c.json({ error: "Packet not found" }, 404);
  const versions = await listPacketVersions(packet.id);
  return c.json({ packet, versions });
});

app.post("/api/finance-packets/:id/versions", async (c) => {
  const body = await c.req.json();
  if (!body.body) return c.json({ error: "body is required" }, 400);
  const version = await commitPacketVersion({
    packetId: c.req.param("id"),
    body: body.body,
    changeSummary: body.changeSummary,
    createdBy: agentId(c),
  });
  return c.json({ version }, 201);
});

app.patch("/api/finance-packets/:id", async (c) => {
  const body = await c.req.json();
  if (!body.status) return c.json({ error: "status is required" }, 400);
  const packet = await setPacketStatus(c.req.param("id"), body.status);
  if (!packet) return c.json({ error: "Packet not found" }, 404);
  return c.json({ packet });
});

// ── HEALTH ───────────────────────────────────────────────────────────────────

app.get("/api/health", (c) => c.json({ ok: true, service: "company-in-a-box-api" }));

const port = parseInt(process.env.API_PORT || "3100", 10);

if (process.env.API_STANDALONE !== "0") {
  serve({ fetch: app.fetch, port }, (info) => {
    console.log(`[ciab-api] listening on http://localhost:${info.port}/api`);
  });
}

export { app };
