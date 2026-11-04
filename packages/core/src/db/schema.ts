import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { ulid } from "ulid";

// ============================================================================
// ORGANIZATION
// ============================================================================

export const companies = sqliteTable("companies", {
  id: text("id").primaryKey().$defaultFn(() => ulid()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  settings: text("settings", { mode: "json" }).$type<CompanySettings>().default({} as CompanySettings),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  slugIdx: uniqueIndex("companies_slug_idx").on(table.slug),
}));

export interface CompanySettings {
  requireBoardApprovalForNewAgents: boolean;
  defaultAgentBudgetCents: number;
  defaultCurrency: string;
  timezone: string;
  features: {
    evidenceVault: boolean;
    financePackets: boolean;
    fleetManagement: boolean;
    skillEvolution: boolean;
  };
}

export const members = sqliteTable("members", {
  id: text("id").primaryKey().$defaultFn(() => ulid()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  email: text("email").notNull(),
  name: text("name"),
  role: text("role", { enum: ["owner", "admin", "member", "viewer"] }).notNull().default("member"),
  status: text("status", { enum: ["active", "invited", "suspended"] }).notNull().default("invited"),
  avatarUrl: text("avatar_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  companyUserIdx: uniqueIndex("members_company_user_idx").on(table.companyId, table.userId),
  companyIdx: index("members_company_idx").on(table.companyId),
}));

// ============================================================================
// AGENTS
// ============================================================================

export const agents = sqliteTable("agents", {
  id: text("id").primaryKey().$defaultFn(() => ulid()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role").notNull(),
  title: text("title"),
  icon: text("icon"),
  description: text("description"),
  adapterType: text("adapter_type").notNull(),
  adapterConfig: text("adapter_config", { mode: "json" }).$type<Record<string, unknown>>().default({}),
  runtimeConfig: text("runtime_config", { mode: "json" }).$type<AgentRuntimeConfig>().default({}),
  permissions: text("permissions", { mode: "json" }).$type<AgentPermissions>().default({}),
  budgetMonthlyCents: integer("budget_monthly_cents").notNull().default(0),
  spentMonthlyCents: integer("spent_monthly_cents").notNull().default(0),
  status: text("status", { enum: ["idle", "running", "paused", "terminated", "pending_approval"] }).notNull().default("pending_approval"),
  pauseReason: text("pause_reason"),
  reportsTo: text("reports_to").references(() => agents.id, { onDelete: "set null" }),
  taxonomyVerified: integer("taxonomy_verified", { mode: "boolean" }).notNull().default(false),
  taxonomyVerifiedAt: integer("taxonomy_verified_at", { mode: "timestamp" }),
  taxonomyVersion: text("taxonomy_version"),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>().default({}),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  lastHeartbeatAt: integer("last_heartbeat_at", { mode: "timestamp" }),
}, (table) => ({
  companyIdx: index("agents_company_idx").on(table.companyId),
  statusIdx: index("agents_status_idx").on(table.status),
  reportsToIdx: index("agents_reports_to_idx").on(table.reportsTo),
}));

export interface AgentRuntimeConfig {
  heartbeat?: {
    intervalMs?: number;
    maxConcurrentRuns?: number;
  };
  sandbox?: {
    mode?: "strict" | "permissive" | "off";
    allowedTools?: string[];
  };
  memory?: {
    enabled?: boolean;
    maxTokens?: number;
  };
}

export interface AgentPermissions {
  canCreateAgents?: boolean;
  canCreateSkills?: boolean;
  canCreateTasks?: boolean;
  canApproveTasks?: boolean;
  canManageFinance?: boolean;
  canManageEvidence?: boolean;
  canManageFleet?: boolean;
  canManageMembers?: boolean;
  builtInMutationPolicy?: {
    requiresDisplayedDiff?: boolean;
    requiresAcceptedTaskInteraction?: boolean;
    applyInSeparateFollowUpRun?: boolean;
  };
}

// ============================================================================
// TASKS / ISSUES
// ============================================================================

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey().$defaultFn(() => ulid()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  status: text("status", { enum: ["planning", "active", "on_hold", "completed", "cancelled"] }).notNull().default("planning"),
  targetDate: integer("target_date", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  companySlugIdx: uniqueIndex("projects_company_slug_idx").on(table.companyId, table.slug),
  companyIdx: index("projects_company_idx").on(table.companyId),
}));

export const issues = sqliteTable("issues", {
  id: text("id").primaryKey().$defaultFn(() => ulid()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
  identifier: text("identifier").notNull(), // e.g., "ENG-123"
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["backlog", "todo", "in_progress", "review", "blocked", "done", "cancelled"] }).notNull().default("backlog"),
  priority: text("priority", { enum: ["low", "medium", "high", "critical"] }).notNull().default("medium"),
  type: text("type", { enum: ["feature", "bug", "chore", "research", "security", "compliance"] }).notNull().default("feature"),
  assigneeAgentId: text("assignee_agent_id").references(() => agents.id, { onDelete: "set null" }),
  reporterId: text("reporter_id").notNull(),
  parentId: text("parent_id").references(() => issues.id, { onDelete: "set null" }),
  goalId: text("goal_id"),
  billingCode: text("billing_code"),
  labels: text("labels", { mode: "json" }).$type<string[]>().default([]),
  workMode: text("work_mode", { enum: ["sync", "async", "hybrid"] }).default("async"),
  executionRunId: text("execution_run_id"),
  executionAgentNameKey: text("execution_agent_name_key"),
  executionLockedAt: integer("execution_locked_at", { mode: "timestamp" }),
  monitorNextCheckAt: integer("monitor_next_check_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  completedAt: integer("completed_at", { mode: "timestamp" }),
}, (table) => ({
  companyIdx: index("issues_company_idx").on(table.companyId),
  projectIdx: index("issues_project_idx").on(table.projectId),
  assigneeIdx: index("issues_assignee_idx").on(table.assigneeAgentId),
  statusIdx: index("issues_status_idx").on(table.status),
  parentIdx: index("issues_parent_idx").on(table.parentId),
  identifierIdx: uniqueIndex("issues_identifier_idx").on(table.companyId, table.identifier),
}));

export const issueRelations = sqliteTable("issue_relations", {
  id: text("id").primaryKey().$defaultFn(() => ulid()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  issueId: text("issue_id").notNull().references(() => issues.id, { onDelete: "cascade" }),
  relatedIssueId: text("related_issue_id").notNull().references(() => issues.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["blocks", "blocked_by", "relates_to", "duplicates", "duplicated_by", "parent_of", "child_of"] }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  issueIdx: index("issue_relations_issue_idx").on(table.issueId),
  relatedIdx: index("issue_relations_related_idx").on(table.relatedIssueId),
  typeIdx: index("issue_relations_type_idx").on(table.type),
}));

// ============================================================================
// EVIDENCE VAULT
// ============================================================================

export const evidenceItems = sqliteTable("evidence_items", {
  id: text("id").primaryKey().$defaultFn(() => ulid()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  kind: text("kind", { enum: ["document", "spreadsheet", "pdf", "image", "audio", "video", "code", "financial", "legal", "technical", "other"] }).notNull(),
  description: text("description"),
  fileName: text("file_name"),
  sha256: text("sha256").notNull(),
  vaultPath: text("vault_path").notNull(),
  tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
  status: text("status", { enum: ["draft", "verified", "archived", "disputed"] }).notNull().default("draft"),
  source: text("source", { enum: ["upload", "generated", "imported", "linked"] }).notNull().default("upload"),
  createdBy: text("created_by").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  companyIdx: index("evidence_company_idx").on(table.companyId),
  sha256Idx: uniqueIndex("evidence_sha256_idx").on(table.sha256),
  kindIdx: index("evidence_kind_idx").on(table.kind),
  statusIdx: index("evidence_status_idx").on(table.status),
}));

export const sources = sqliteTable("sources", {
  id: text("id").primaryKey().$defaultFn(() => ulid()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  kind: text("kind", { enum: ["document", "url", "api", "person", "organization", "regulation", "standard", "other"] }).notNull(),
  url: text("url"),
  citation: text("citation"),
  authority: text("authority"),
  notes: text("notes"),
  status: text("status", { enum: ["active", "deprecated", "superseded"] }).notNull().default("active"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const citations = sqliteTable("citations", {
  id: text("id").primaryKey().$defaultFn(() => ulid()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  evidenceId: text("evidence_id").notNull().references(() => evidenceItems.id, { onDelete: "cascade" }),
  sourceId: text("source_id").notNull().references(() => sources.id, { onDelete: "cascade" }),
  note: text("note"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  evidenceIdx: index("citations_evidence_idx").on(table.evidenceId),
  sourceIdx: index("citations_source_idx").on(table.sourceId),
}));

// ============================================================================
// APPROVAL GATES
// ============================================================================

export const approvalRequests = sqliteTable("approval_requests", {
  id: text("id").primaryKey().$defaultFn(() => ulid()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  actionType: text("action_type", { enum: ["contract", "payment", "legal_conclusion", "external_submission", "destructive_change", "agent_provision", "skill_publish", "finance_packet", "evidence_release"] }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["pending", "approved", "blocked", "expired"] }).notNull().default("pending"),
  requestedBy: text("requested_by").notNull(),
  decidedBy: text("decided_by"),
  decidedAt: integer("decided_at", { mode: "timestamp" }),
  decisionNote: text("decision_note"),
  payload: text("payload", { mode: "json" }).$type<Record<string, unknown>>().default({}),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  companyIdx: index("approvals_company_idx").on(table.companyId),
  statusIdx: index("approvals_status_idx").on(table.status),
  requestedByIdx: index("approvals_requested_by_idx").on(table.requestedBy),
}));

// ============================================================================
// FINANCE PACKETS
// ============================================================================

export const financePackets = sqliteTable("finance_packets", {
  id: text("id").primaryKey().$defaultFn(() => ulid()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  kind: text("kind", { enum: ["noi", "dscr", "ucc1", "payment_schedule", "revenue_waterfall", "evidence_packet", "other"] }).notNull(),
  status: text("status", { enum: ["draft", "review", "approved", "executed", "archived"] }).notNull().default("draft"),
  createdBy: text("created_by").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const financePacketVersions = sqliteTable("finance_packet_versions", {
  id: text("id").primaryKey().$defaultFn(() => ulid()),
  packetId: text("packet_id").notNull().references(() => financePackets.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  sha256: text("sha256").notNull(),
  parentSha256: text("parent_sha256"),
  body: text("body", { mode: "json" }).$type<Record<string, unknown>>().notNull(),
  changeSummary: text("change_summary"),
  createdBy: text("created_by").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  packetIdx: index("finance_versions_packet_idx").on(table.packetId),
  versionIdx: uniqueIndex("finance_versions_packet_version_idx").on(table.packetId, table.version),
}));

// ============================================================================
// AUDIT LOG
// ============================================================================

export const auditEvents = sqliteTable("audit_events", {
  id: text("id").primaryKey().$defaultFn(() => ulid()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  action: text("action").notNull(),
  actorType: text("actor_type", { enum: ["user", "agent", "system"] }).notNull(),
  actorId: text("actor_id").notNull(),
  role: text("role"),
  reason: text("reason"),
  detail: text("detail", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  companyIdx: index("audit_company_idx").on(table.companyId),
  entityIdx: index("audit_entity_idx").on(table.entityType, table.entityId),
  actorIdx: index("audit_actor_idx").on(table.actorType, table.actorId),
  createdAtIdx: index("audit_created_idx").on(table.createdAt),
}));

// ============================================================================
// ACTIVITY LOG
// ============================================================================

export const activityLog = sqliteTable("activity_log", {
  id: text("id").primaryKey().$defaultFn(() => ulid()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  actorType: text("actor_type", { enum: ["user", "agent", "system"] }).notNull(),
  actorId: text("actor_id").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  meta: text("meta", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  companyIdx: index("activity_company_idx").on(table.companyId),
  entityIdx: index("activity_entity_idx").on(table.entityType, table.entityId),
  actorIdx: index("activity_actor_idx").on(table.actorType, table.actorId),
  createdAtIdx: index("activity_created_idx").on(table.createdAt),
}));

// ============================================================================
// AGENT API KEYS
// ============================================================================

export const agentApiKeys = sqliteTable("agent_api_keys", {
  id: text("id").primaryKey().$defaultFn(() => ulid()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  agentId: text("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  keyHash: text("key_hash").notNull(),
  keyPrefix: text("key_prefix").notNull(),
  scopes: text("scopes", { mode: "json" }).$type<string[]>().default([]),
  lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  revokedAt: integer("revoked_at", { mode: "timestamp" }),
}, (table) => ({
  agentIdx: index("agent_api_keys_agent_idx").on(table.agentId),
  prefixIdx: index("agent_api_keys_prefix_idx").on(table.keyPrefix),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;
export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Issue = typeof issues.$inferSelect;
export type NewIssue = typeof issues.$inferInsert;
export type EvidenceItem = typeof evidenceItems.$inferSelect;
export type NewEvidenceItem = typeof evidenceItems.$inferInsert;
export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;
export type Citation = typeof citations.$inferSelect;
export type NewCitation = typeof citations.$inferInsert;
export type ApprovalRequest = typeof approvalRequests.$inferSelect;
export type NewApprovalRequest = typeof approvalRequests.$inferInsert;
export type FinancePacket = typeof financePackets.$inferSelect;
export type NewFinancePacket = typeof financePackets.$inferInsert;
export type FinancePacketVersion = typeof financePacketVersions.$inferSelect;
export type NewFinancePacketVersion = typeof financePacketVersions.$inferInsert;
export type AuditEvent = typeof auditEvents.$inferSelect;
export type NewAuditEvent = typeof auditEvents.$inferInsert;
export type ActivityLog = typeof activityLog.$inferSelect;
export type NewActivityLog = typeof activityLog.$inferInsert;
export type AgentApiKey = typeof agentApiKeys.$inferSelect;
export type NewAgentApiKey = typeof agentApiKeys.$inferInsert;
// ── Better-Auth tables ────────────────────────────────────────────────────
// Canonical better-auth user/session/account/verification tables (sqlite).
export const authUsers = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const authSessions = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => authUsers.id, { onDelete: "cascade" }),
});

export const authAccounts = sqliteTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => authUsers.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const authVerifications = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});
