import { ulid } from "ulid";
import { EventEmitter } from "events";

export interface RoleDefinition {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: "engineering" | "research" | "finance" | "legal" | "security" | "marketing" | "support" | "devops" | "management" | "general";
  level: "junior" | "mid" | "senior" | "lead" | "principal";
  requiredSkills: string[];
  optionalSkills: string[];
  requiredPermissions: string[];
  defaultBudgetMonthlyCents: number;
  defaultAdapterType: string;
  defaultAdapterConfig: Record<string, any>;
  defaultRuntimeConfig: Record<string, any>;
  reportsTo?: string;
  canManageAgents: boolean;
  canCreateSkills: boolean;
  canApproveTasks: boolean;
  canManageFinance: boolean;
  canManageEvidence: boolean;
  canManageFleet: boolean;
  canManageMembers: boolean;
  metadata: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export interface RoleInstance {
  id: string;
  roleDefinitionId: string;
  companyId: string;
  agentId?: string;
  assignedBy: string;
  assignedAt: number;
  status: "active" | "inactive" | "pending";
  customConfig?: Record<string, any>;
  performanceMetrics?: RolePerformanceMetrics;
}

export interface RolePerformanceMetrics {
  tasksCompleted: number;
  tasksFailed: number;
  avgCompletionTimeMs: number;
  qualityScore: number;
  lastEvaluatedAt: number;
}

export interface RoleAssignment {
  roleDefinitionId: string;
  companyId: string;
  agentId?: string;
  assignedBy: string;
  customConfig?: Record<string, any>;
}

export class RoleRegistry extends EventEmitter {
  private definitions: Map<string, RoleDefinition> = new Map();
  private instances: Map<string, RoleInstance[]> = new Map(); // companyId -> instances

  registerRole(definition: RoleDefinition): void {
    if (this.definitions.has(definition.id)) {
      throw new Error(`Role ${definition.id} already registered`);
    }
    this.definitions.set(definition.id, definition);
    this.emit("roleRegistered", definition);
  }

  unregisterRole(roleId: string): void {
    const role = this.definitions.get(roleId);
    if (!role) throw new Error(`Role ${roleId} not found`);
    this.definitions.delete(roleId);
    this.emit("roleUnregistered", roleId);
  }

  getRole(roleId: string): RoleDefinition | undefined {
    return this.definitions.get(roleId);
  }

  listRoles(filters?: { category?: string; level?: string }): RoleDefinition[] {
    let roles = Array.from(this.definitions.values());

    if (filters?.category) {
      roles = roles.filter(r => r.category === filters.category);
    }
    if (filters?.level) {
      roles = roles.filter(r => r.level === filters.level);
    }

    return roles.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  getCategories(): string[] {
    const categories = new Set<string>();
    for (const role of this.definitions.values()) {
      categories.add(role.category);
    }
    return Array.from(categories).sort();
  }

  getLevels(): string[] {
    return ["junior", "mid", "senior", "lead", "principal"];
  }

  async assignRole(input: {
    roleDefinitionId: string;
    companyId: string;
    agentId?: string;
    assignedBy: string;
    customConfig?: Record<string, any>;
  }): Promise<any> {
    const role = this.definitions.get(input.roleDefinitionId);
    if (!role) throw new Error(`Role ${input.roleDefinitionId} not found`);

    const instance: any = {
      id: ulid(),
      roleDefinitionId: input.roleDefinitionId,
      companyId: input.companyId,
      agentId: input.agentId,
      assignedBy: input.assignedBy,
      assignedAt: Date.now(),
      status: "active",
      customConfig: input.customConfig,
      performanceMetrics: {
        tasksCompleted: 0,
        tasksFailed: 0,
        avgCompletionTimeMs: 0,
        qualityScore: 1.0,
        lastEvaluatedAt: 0,
      },
    };

    const companyInstances = this.instances.get(input.companyId) || [];
    companyInstances.push(instance);
    this.instances.set(input.companyId, companyInstances);

    this.emit("roleAssigned", { companyId: input.companyId, roleId: input.roleDefinitionId, instance });
    return instance;
  }

  async unassignRole(companyId: string, instanceId: string): Promise<void> {
    const instances = this.instances.get(companyId) || [];
    const index = instances.findIndex(i => i.id === instanceId);
    if (index >= 0) {
      instances.splice(index, 1);
    }
  }

  getInstances(companyId: string): any[] {
    return this.instances.get(companyId) || [];
  }

  getInstance(instanceId: string): any | undefined {
    for (const instances of this.instances.values()) {
      const instance = instances.find(i => i.id === instanceId);
      if (instance) return instance;
    }
    return undefined;
  }

  async updateInstanceConfig(instanceId: string, config: Record<string, any>): Promise<void> {
    for (const instances of this.instances.values()) {
      const instance = instances.find(i => i.id === instanceId);
      if (instance) {
        instance.customConfig = { ...instance.customConfig, ...config };
        break;
      }
    }
  }

  async updatePerformanceMetrics(instanceId: string, metrics: Partial<any>): Promise<void> {
    for (const instances of this.instances.values()) {
      const instance = instances.find(i => i.id === instanceId);
      if (instance) {
        instance.performanceMetrics = { ...instance.performanceMetrics, ...metrics, lastEvaluatedAt: Date.now() };
        break;
      }
    }
  }

  getRolesByCategory(category: string): any[] {
    return Array.from(this.definitions.values()).filter(r => r.category === category);
  }

  getRolesByLevel(level: string): any[] {
    return Array.from(this.definitions.values()).filter(r => r.level === level);
  }

  searchRoles(query: string): any[] {
    const queryLower = query.toLowerCase();
    return Array.from(this.definitions.values()).filter(r =>
      r.name.toLowerCase().includes(queryLower) ||
      r.displayName.toLowerCase().includes(queryLower) ||
      r.description.toLowerCase().includes(queryLower)
    );
  }
}

export const roleRegistry = new RoleRegistry();

// Built-in role definitions
export const BUILTIN_ROLES: RoleDefinition[] = [
  {
    id: "engineer",
    name: "engineer",
    displayName: "Software Engineer",
    description: "Writes code, debugs, ships features, fixes bugs, handles infrastructure",
    category: "engineering",
    level: "mid",
    requiredSkills: ["code-review", "testing", "debugging", "git-workflow"],
    optionalSkills: ["system-design", "api-design", "database-design", "performance-optimization"],
    requiredPermissions: ["tasks:create", "tasks:update", "code:read", "code:write"],
    defaultBudgetMonthlyCents: 50000,
    defaultAdapterType: "openclaw",
    defaultAdapterConfig: {},
    defaultRuntimeConfig: { heartbeat: { intervalMs: 30000, maxConcurrentRuns: 20 } },
    reportsTo: "lead_engineer",
    canManageAgents: false,
    canCreateSkills: false,
    canApproveTasks: false,
    canManageFinance: false,
    canManageEvidence: false,
    canManageFleet: false,
    canManageMembers: false,
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "lead_engineer",
    name: "lead_engineer",
    displayName: "Lead Engineer",
    description: "Leads engineering team, architecture decisions, code review, mentoring",
    category: "engineering",
    level: "lead",
    requiredSkills: ["code-review", "system-design", "team-leadership", "architecture-planning"],
    optionalSkills: ["mentoring", "technical-strategy", "hiring"],
    requiredPermissions: ["tasks:create", "tasks:update", "tasks:approve", "agents:manage", "code:read", "code:write"],
    defaultBudgetMonthlyCents: 100000,
    defaultAdapterType: "openclaw",
    defaultAdapterConfig: {},
    defaultRuntimeConfig: { heartbeat: { intervalMs: 30000, maxConcurrentRuns: 50 } },
    reportsTo: "cto",
    canManageAgents: true,
    canCreateSkills: true,
    canApproveTasks: true,
    canManageFinance: false,
    canManageEvidence: false,
    canManageFleet: false,
    canManageMembers: true,
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "researcher",
    name: "researcher",
    displayName: "Researcher",
    description: "Conducts research, literature reviews, data analysis, synthesis",
    category: "research",
    level: "mid",
    requiredSkills: ["web-search", "source-verification", "synthesis", "citation"],
    optionalSkills: ["literature-review", "hypothesis-testing", "data-collection", "statistical-analysis"],
    requiredPermissions: ["tasks:create", "tasks:update", "research:conduct", "evidence:create"],
    defaultBudgetMonthlyCents: 30000,
    defaultAdapterType: "openclaw",
    defaultAdapterConfig: {},
    defaultRuntimeConfig: { heartbeat: { intervalMs: 60000, maxConcurrentRuns: 10 } },
    reportsTo: "research_lead",
    canManageAgents: false,
    canCreateSkills: false,
    canApproveTasks: false,
    canManageFinance: false,
    canManageEvidence: true,
    canManageFleet: false,
    canManageMembers: false,
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "finance_analyst",
    name: "finance_analyst",
    displayName: "Finance Analyst",
    description: "Financial modeling, DSCR calculation, NOI analysis, compliance",
    category: "finance",
    level: "mid",
    requiredSkills: ["financial-modeling", "dscr-calculation", "noi-analysis", "compliance"],
    optionalSkills: ["valuation", "risk-assessment", "regulatory-reporting", "audit-preparation"],
    requiredPermissions: ["tasks:create", "tasks:update", "finance:read", "finance:write", "evidence:create"],
    defaultBudgetMonthlyCents: 50000,
    defaultAdapterType: "openclaw",
    defaultAdapterConfig: {},
    defaultRuntimeConfig: { heartbeat: { intervalMs: 3600000, maxConcurrentRuns: 5 } },
    reportsTo: "cfo",
    canManageAgents: false,
    canCreateSkills: false,
    canApproveTasks: false,
    canManageFinance: true,
    canManageEvidence: true,
    canManageFleet: false,
    canManageMembers: false,
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "legal_counsel",
    name: "legal_counsel",
    displayName: "Legal Counsel",
    description: "Contract review, compliance, risk assessment, regulatory research",
    category: "legal",
    level: "senior",
    requiredSkills: ["contract-review", "compliance-check", "risk-assessment"],
    optionalSkills: ["regulatory-research", "due-diligence", "litigation-support", "ip-management"],
    requiredPermissions: ["tasks:create", "tasks:update", "legal:review", "contracts:approve", "evidence:create"],
    defaultBudgetMonthlyCents: 100000,
    defaultAdapterType: "openclaw",
    defaultAdapterConfig: {},
    defaultRuntimeConfig: { heartbeat: { intervalMs: 3600000, maxConcurrentRuns: 5 } },
    reportsTo: "general_counsel",
    canManageAgents: false,
    canCreateSkills: false,
    canApproveTasks: true,
    canManageFinance: false,
    canManageEvidence: true,
    canManageFleet: false,
    canManageMembers: false,
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "security_engineer",
    name: "security_engineer",
    displayName: "Security Engineer",
    description: "Threat modeling, vulnerability assessment, incident response",
    category: "security",
    level: "mid",
    requiredSkills: ["threat-modeling", "vulnerability-assessment", "incident-response"],
    optionalSkills: ["penetration-testing", "security-auditing", "compliance-auditing", "encryption"],
    requiredPermissions: ["tasks:create", "tasks:update", "security:scan", "security:audit", "evidence:create"],
    defaultBudgetMonthlyCents: 50000,
    defaultAdapterType: "openclaw",
    defaultAdapterConfig: {},
    defaultRuntimeConfig: { heartbeat: { intervalMs: 30000, maxConcurrentRuns: 20 } },
    reportsTo: "ciso",
    canManageAgents: false,
    canCreateSkills: false,
    canApproveTasks: false,
    canManageFinance: false,
    canManageEvidence: true,
    canManageFleet: false,
    canManageMembers: false,
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "marketing_specialist",
    name: "marketing_specialist",
    displayName: "Marketing Specialist",
    description: "Content creation, SEO, analytics, campaign management",
    category: "marketing",
    level: "mid",
    requiredSkills: ["content-creation", "seo", "analytics", "campaign-management"],
    optionalSkills: ["brand-strategy", "social-media", "email-marketing", "conversion-optimization"],
    requiredPermissions: ["tasks:create", "tasks:update", "marketing:create", "analytics:read"],
    defaultBudgetMonthlyCents: 30000,
    defaultAdapterType: "openclaw",
    defaultAdapterConfig: {},
    defaultRuntimeConfig: { heartbeat: { intervalMs: 3600000, maxConcurrentRuns: 10 } },
    reportsTo: "cmo",
    canManageAgents: false,
    canCreateSkills: false,
    canApproveTasks: false,
    canManageFinance: false,
    canManageEvidence: false,
    canManageFleet: false,
    canManageMembers: false,
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "support_engineer",
    name: "support_engineer",
    displayName: "Support Engineer",
    description: "Ticket triage, troubleshooting, documentation, escalation",
    category: "support",
    level: "mid",
    requiredSkills: ["ticket-triage", "troubleshooting", "documentation", "escalation"],
    optionalSkills: ["customer-communication", "root-cause-analysis", "knowledge-base", "sla-management"],
    requiredPermissions: ["tasks:create", "tasks:update", "support:respond", "docs:write"],
    defaultBudgetMonthlyCents: 20000,
    defaultAdapterType: "openclaw",
    defaultAdapterConfig: {},
    defaultRuntimeConfig: { heartbeat: { intervalMs: 60000, maxConcurrentRuns: 20 } },
    reportsTo: "support_lead",
    canManageAgents: false,
    canCreateSkills: false,
    canApproveTasks: false,
    canManageFinance: false,
    canManageEvidence: false,
    canManageFleet: false,
    canManageMembers: false,
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "devops_engineer",
    name: "devops_engineer",
    displayName: "DevOps Engineer",
    description: "Infrastructure, CI/CD, monitoring, incident response",
    category: "devops",
    level: "mid",
    requiredSkills: ["infrastructure", "ci-cd", "monitoring", "incident-response"],
    optionalSkills: ["container-orchestration", "cloud-architecture", "automation", "security-hardening"],
    requiredPermissions: ["tasks:create", "tasks:update", "infra:manage", "deploy:manage", "monitoring:manage"],
    defaultBudgetMonthlyCents: 50000,
    defaultAdapterType: "openclaw",
    defaultAdapterConfig: {},
    defaultRuntimeConfig: { heartbeat: { intervalMs: 60000, maxConcurrentRuns: 10 } },
    reportsTo: "devops_lead",
    canManageAgents: false,
    canCreateSkills: false,
    canApproveTasks: false,
    canManageFinance: false,
    canManageEvidence: false,
    canManageFleet: false,
    canManageMembers: false,
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "project_manager",
    name: "project_manager",
    displayName: "Project Manager",
    description: "Planning, delegation, review, reporting, stakeholder communication",
    category: "management",
    level: "mid",
    requiredSkills: ["planning", "delegation", "review", "reporting"],
    optionalSkills: ["team-leadership", "project-management", "stakeholder-communication", "resource-allocation"],
    requiredPermissions: ["tasks:create", "tasks:update", "tasks:approve", "projects:manage", "reports:generate"],
    defaultBudgetMonthlyCents: 50000,
    defaultAdapterType: "openclaw",
    defaultAdapterConfig: {},
    defaultRuntimeConfig: { heartbeat: { intervalMs: 3600000, maxConcurrentRuns: 10 } },
    reportsTo: "director",
    canManageAgents: true,
    canCreateSkills: false,
    canApproveTasks: true,
    canManageFinance: false,
    canManageEvidence: false,
    canManageFleet: false,
    canManageMembers: true,
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

// Register built-in roles
for (const role of BUILTIN_ROLES) {
  roleRegistry.registerRole(role);
}