import { getDatabase } from "../db/client";
import { agents, agentApiKeys, type Agent, type NewAgent, type AgentRuntimeConfig, type AgentPermissions } from "../db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { ulid } from "ulid";
import { createHash, randomBytes } from "crypto";
import { verifyTaxonomyGate } from "@company-in-a-box/taxonomy/src/verification";

export interface ProvisionAgentInput {
  companyId: string;
  name: string;
  role: string;
  title?: string;
  icon?: string;
  description?: string;
  adapterType: string;
  adapterConfig?: Record<string, unknown>;
  runtimeConfig?: Partial<AgentRuntimeConfig>;
  permissions?: Partial<AgentPermissions>;
  budgetMonthlyCents?: number;
  reportsTo?: string;
  skipTaxonomyGate?: boolean; // For testing only
}

export interface UpdateAgentInput {
  name?: string;
  role?: string;
  title?: string;
  icon?: string;
  description?: string;
  adapterConfig?: Record<string, unknown>;
  runtimeConfig?: Partial<AgentRuntimeConfig>;
  permissions?: Partial<AgentPermissions>;
  budgetMonthlyCents?: number;
  status?: "idle" | "running" | "paused" | "terminated";
  pauseReason?: string;
  reportsTo?: string;
}

export async function provisionAgent(input: ProvisionAgentInput) {
  const db = getDatabase();

  // Verify taxonomy gate (mandatory for all agents)
  if (!input.skipTaxonomyGate) {
    const gateResult = await verifyTaxonomyGate({
      agentRole: input.role,
      adapterType: input.adapterType,
      requiredSkills: getRequiredSkillsForRole(input.role),
    });

    if (!gateResult.passed) {
      throw new Error(`Taxonomy gate failed: ${gateResult.failures.join(", ")}`);
    }
  }

  // Verify adapter type is supported
  const supportedAdapters = [
    "openclaw",
    "claude_local",
    "codex_local",
    "gemini_local",
    "opencode_local",
    "process",
    "hermes_local",
    "hermes_gateway",
  ];

  if (!supportedAdapters.includes(input.adapterType)) {
    throw new Error(`Unsupported adapter type: ${input.adapterType}`);
  }

  // Verify reportsTo exists if provided
  if (input.reportsTo) {
    const manager = await db.select().from(agents).where(eq(agents.id, input.reportsTo)).limit(1);
    if (!manager[0]) throw new Error("Manager agent not found");
    if (manager[0].companyId !== input.companyId) throw new Error("Manager must be in same company");
  }

  const defaultPermissions: AgentPermissions = {
    canCreateAgents: false,
    canCreateSkills: false,
    canCreateTasks: true,
    canApproveTasks: false,
    canManageFinance: false,
    canManageEvidence: false,
    canManageFleet: false,
    canManageMembers: false,
    builtInMutationPolicy: {
      requiresDisplayedDiff: true,
      requiresAcceptedTaskInteraction: true,
      applyInSeparateFollowUpRun: true,
    },
    ...input.permissions,
  };

  const defaultRuntimeConfig: AgentRuntimeConfig = {
    heartbeat: {
      intervalMs: 30000,
      maxConcurrentRuns: 20,
    },
    sandbox: {
      mode: "strict",
      allowedTools: [],
    },
    memory: {
      enabled: true,
      maxTokens: 8192,
    },
    ...input.runtimeConfig,
  };

  const agent: NewAgent = {
    id: ulid(),
    companyId: input.companyId,
    name: input.name,
    role: input.role,
    title: input.title,
    icon: input.icon,
    description: input.description,
    adapterType: input.adapterType,
    adapterConfig: input.adapterConfig || {},
    runtimeConfig: defaultRuntimeConfig,
    permissions: defaultPermissions,
    budgetMonthlyCents: input.budgetMonthlyCents || 0,
    spentMonthlyCents: 0,
    status: "pending_approval",
    reportsTo: input.reportsTo,
    taxonomyVerified: false,
    taxonomyVersion: "v1",
    metadata: {
      provisionedAt: Date.now(),
      provisionedBy: "system",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(agents).values(agent);

  // Run taxonomy gate verification
  const gateResult = await verifyTaxonomyGate({
    agentRole: input.role,
    adapterType: input.adapterType,
    requiredSkills: getRequiredSkillsForRole(input.role),
  });

  if (!gateResult.passed) {
    // Mark as failed but keep the agent record
    await db
      .update(agents)
      .set({
        status: "terminated",
        metadata: {
          taxonomyGateFailed: true,
          failures: gateResult.failures,
        },
      })
      .where(eq(agents.id, agent.id));

    throw new Error(`Taxonomy gate failed: ${gateResult.failures.join(", ")}`);
  }

  // Mark as verified
  await db
    .update(agents)
    .set({
      taxonomyVerified: true,
      taxonomyVerifiedAt: Date.now(),
      taxonomyVersion: "v1",
      status: "idle",
    })
    .where(eq(agents.id, agent.id));

  return { agent: { ...agent, taxonomyVerified: true, status: "idle" }, gateResult };
}

function getRequiredSkillsForRole(role: string): string[] {
  const roleSkills: Record<string, string[]> = {
    "engineer": ["code-review", "testing", "debugging", "git-workflow"],
    "researcher": ["web-search", "source-verification", "synthesis", "citation"],
    "analyst": ["data-analysis", "modeling", "visualization", "reporting"],
    "manager": ["planning", "delegation", "review", "reporting"],
    "finance": ["financial-modeling", "dscr-calculation", "noi-analysis", "compliance"],
    "legal": ["contract-review", "compliance-check", "risk-assessment"],
    "security": ["threat-modeling", "vulnerability-assessment", "incident-response"],
    "marketing": ["content-creation", "seo", "analytics", "campaign-management"],
    "support": ["ticket-triage", "troubleshooting", "documentation", "escalation"],
    "devops": ["infrastructure", "ci-cd", "monitoring", "incident-response"],
    "default": ["communication", "task-management", "documentation"],
  };

  return roleSkills[role] || roleSkills.default;
}

export async function getAgent(agentId: string) {
  const db = getDatabase();
  const result = await db.select().from(agents).where(eq(agents.id, agentId)).limit(1);
  return result[0] || null;
}

export async function getAgentByName(companyId: string, name: string) {
  const db = getDatabase();
  const result = await db.select().from(agents).where(and(eq(agents.companyId, companyId), eq(agents.name, name))).limit(1);
  return result[0] || null;
}

export async function listAgents(companyId: string, options?: { status?: string; role?: string }) {
  const db = getDatabase();
  const conditions = [eq(agents.companyId, companyId)];

  if (options?.status) {
    conditions.push(eq(agents.status, options.status as any));
  }
  if (options?.role) {
    conditions.push(eq(agents.role, options.role));
  }

  return db.select().from(agents).where(and(...conditions)).orderBy(desc(agents.createdAt));
}

export async function updateAgent(agentId: string, input: UpdateAgentInput) {
  const db = getDatabase();

  const updateData: Partial<typeof agents.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.name !== undefined) updateData.name = input.name;
  if (input.role !== undefined) updateData.role = input.role;
  if (input.title !== undefined) updateData.title = input.title;
  if (input.icon !== undefined) updateData.icon = input.icon;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.adapterConfig !== undefined) updateData.adapterConfig = input.adapterConfig;
  if (input.runtimeConfig !== undefined) updateData.runtimeConfig = input.runtimeConfig;
  if (input.permissions !== undefined) updateData.permissions = input.permissions;
  if (input.budgetMonthlyCents !== undefined) updateData.budgetMonthlyCents = input.budgetMonthlyCents;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.pauseReason !== undefined) updateData.pauseReason = input.pauseReason;
  if (input.reportsTo !== undefined) updateData.reportsTo = input.reportsTo;

  await db.update(agents).set(updateData).where(eq(agents.id, agentId));

  return getAgent(agentId);
}

export async function pauseAgent(agentId: string, reason: string) {
  return updateAgent(agentId, { status: "paused", pauseReason: reason });
}

export async function resumeAgent(agentId: string) {
  return updateAgent(agentId, { status: "idle", pauseReason: null });
}

export async function terminateAgent(agentId: string) {
  const db = getDatabase();
  await db.update(agents).set({ status: "terminated", updatedAt: new Date() }).where(eq(agents.id, agentId));
  return { success: true };
}

export async function createAgentApiKey(agentId: string, name: string, scopes: string[] = [], expiresInDays = 90) {
  const db = getDatabase();

  const rawKey = `cib_${randomBytes(32).toString("hex")}`;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const keyPrefix = rawKey.slice(0, 12);

  const expiresAt = Date.now() + expiresInDays * 24 * 60 * 60 * 1000;

  await db.insert(agentApiKeys).values({
    id: ulid(),
    companyId: (await getAgent(agentId))?.companyId || "",
    agentId,
    name,
    keyHash,
    keyPrefix,
    scopes,
    expiresAt: new Date(expiresAt),
  });

  return { key: rawKey, prefix: keyPrefix, expiresAt };
}

export async function validateAgentApiKey(keyPrefix: string, keyHash: string) {
  const db = getDatabase();
  const result = await db
    .select()
    .from(agentApiKeys)
    .where(and(eq(agentApiKeys.keyPrefix, keyPrefix), eq(agentApiKeys.keyHash, keyHash)))
    .limit(1);

  if (!result[0]) return null;
  if (result[0].revokedAt) return null;
  if (result[0].expiresAt && result[0].expiresAt.getTime() < Date.now()) return null;

  // Update last used
  await db.update(agentApiKeys).set({ lastUsedAt: new Date() }).where(eq(agentApiKeys.id, result[0].id));

  return result[0];
}

export async function revokeAgentApiKey(keyId: string) {
  const db = getDatabase();
  await db.update(agentApiKeys).set({ revokedAt: new Date() }).where(eq(agentApiKeys.id, keyId));
  return { success: true };
}

export async function listAgentApiKeys(agentId: string) {
  const db = getDatabase();
  return db.select().from(agentApiKeys).where(eq(agentApiKeys.agentId, agentId)).orderBy(desc(agentApiKeys.createdAt));
}

export async function getAgentStats(companyId: string) {
  const db = getDatabase();

  const [total, byStatus, byRole] = await Promise.all([
    db.select({ count: count() }).from(agents).where(eq(agents.companyId, companyId)),
    db.select({ status: agents.status, count: count() }).from(agents).where(eq(agents.companyId, companyId)).groupBy(agents.status),
    db.select({ role: agents.role, count: count() }).from(agents).where(eq(agents.companyId, companyId)).groupBy(agents.role),
  ]);

  return {
    total: total[0]?.count || 0,
    byStatus: byStatus.reduce((acc, row) => ({ ...acc, [row.status]: row.count }), {}),
    byRole: byRole.reduce((acc, row) => ({ ...acc, [row.role]: row.count }), {}),
  };
}