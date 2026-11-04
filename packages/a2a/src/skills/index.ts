import { ulid } from "ulid";
import { EventEmitter } from "events";
import { z } from "zod";
import { skillCatalog } from "@company-in-a-box/skills/src/catalog";
import { roleRegistry } from "@company-in-a-box/skills/src/roles";
import { verifyTaxonomyGate } from "@company-in-a-box/taxonomy/src/verification";

// ============================================================================
// A2A Built-in Skills
// ============================================================================

// Smart Routing Skill
export const smartRoutingSkill = {
  id: "a2a.smart-routing",
  name: "Smart Routing",
  description: "Routes tasks to the most appropriate agent based on capabilities, load, and priority",
  version: "1.0.0",
  category: "a2a",
  tags: ["routing", "delegation", "load-balancing"],
  author: "Company in a Box",
  license: "MIT",
  entryPoint: "smartRouting",
  dependencies: [],
  configSchema: z.object({
    strategy: z.enum(["capability", "load", "priority", "hybrid"]).default("hybrid"),
    maxHops: z.number().default(3),
    timeout: z.number().default(30000),
  }),
  configDefaults: {
    strategy: "hybrid",
    maxHops: 3,
    timeout: 30000,
  },
  permissions: {
    canReadFiles: false,
    canWriteFiles: false,
    canExecuteCommands: false,
    canAccessNetwork: true,
    canAccessDatabase: true,
    canSpawnAgents: true,
    allowedPaths: [],
    deniedPaths: [],
  },
  metadata: {
    a2a: true,
    capability: "routing",
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export async function smartRouting(input: {
  task: any;
  availableAgents: any[];
  config: any;
}): Promise<any> {
  const { task, availableAgents, config } = input;
  
  // Filter agents by capability match
  const capableAgents = availableAgents.filter(agent => {
    // Check if agent has required capabilities for task
    return true; // Simplified
  });

  if (capableAgents.length === 0) {
    throw new Error("No capable agents available");
  }

  // Select based on strategy
  let selectedAgent;
  switch (config.strategy) {
    case "capability":
      // Select agent with best capability match
      selectedAgent = capableAgents[0];
      break;
    case "load":
      // Select least busy agent
      selectedAgent = capableAgents.reduce((a, b) => 
        (a.currentLoad || 0) < (b.currentLoad || 0) ? a : b
      );
      break;
    case "priority":
      // Select highest priority agent
      selectedAgent = capableAgents.sort((a, b) => (b.priority || 0) - (a.priority || 0))[0];
      break;
    case "hybrid":
    default:
      // Weighted scoring
      selectedAgent = capableAgents.reduce((best, agent) => {
        const score = (agent.capabilityScore || 0) * 0.5 + 
                      (1 - (agent.currentLoad || 0)) * 0.3 + 
                      (agent.priority || 0) * 0.2;
        const bestScore = (best.capabilityScore || 0) * 0.5 + 
                          (1 - (best.currentLoad || 0)) * 0.3 + 
                          (best.priority || 0) * 0.2;
        return score > bestScore ? agent : best;
      });
      break;
  }

  return {
    selectedAgent: selectedAgent.id,
    reasoning: `Selected via ${config.strategy} strategy`,
    confidence: 0.9,
  };
}

// Quota Management Skill
export const quotaManagementSkill = {
  id: "a2a.quota-management",
  name: "Quota Management",
  description: "Manages API quotas and rate limits across agents",
  version: "1.0.0",
  category: "a2a",
  tags: ["quota", "rate-limiting", "billing"],
  author: "Company in a Box",
  license: "MIT",
  entryPoint: "quotaManagement",
  dependencies: [],
  configSchema: z.object({
    defaultQuota: z.number().default(1000),
    windowMs: z.number().default(3600000),
    alertThreshold: z.number().default(0.8),
  }),
  configDefaults: {
    defaultQuota: 1000,
    windowMs: 3600000,
    alertThreshold: 0.8,
  },
  permissions: {
    canReadFiles: false,
    canWriteFiles: false,
    canExecuteCommands: false,
    canAccessNetwork: true,
    canAccessDatabase: true,
    canSpawnAgents: false,
    allowedPaths: [],
    deniedPaths: [],
  },
  metadata: {
    a2a: true,
    capability: "quota-management",
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export async function quotaManagement(input: {
  agentId: string;
  requestedTokens: number;
  config: any;
}): Promise<any> {
  // In a real implementation, this would check and update quota in database
  return {
    allowed: true,
    remaining: (input.config?.defaultQuota ?? 0) - input.requestedTokens,
    resetAt: Date.now() + (input.config?.windowMs ?? 0),
  };
}

// Provider Discovery Skill
export const providerDiscoverySkill = {
  id: "a2a.provider-discovery",
  name: "Provider Discovery",
  description: "Discovers and registers available LLM providers and models",
  version: "1.0.0",
  category: "a2a",
  tags: ["provider", "discovery", "models"],
  author: "Company in a Box",
  license: "MIT",
  entryPoint: "providerDiscovery",
  dependencies: [],
  configSchema: z.object({
    refreshInterval: z.number().default(3600000),
    sources: z.array(z.string()).default(["openrouter", "ollama", "openai", "anthropic"]),
  }),
  configDefaults: {
    refreshInterval: 3600000,
    sources: ["openrouter", "ollama", "openai", "anthropic"],
  },
  permissions: {
    canReadFiles: false,
    canWriteFiles: false,
    canExecuteCommands: false,
    canAccessNetwork: true,
    canAccessDatabase: true,
    canSpawnAgents: false,
    allowedPaths: [],
    deniedPaths: [],
  },
  metadata: {
    a2a: true,
    capability: "provider-discovery",
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export async function providerDiscovery(input: {
  sources: string[];
  config: any;
}): Promise<any> {
  // In a real implementation, this would query provider APIs
  return {
    providers: [
      { id: "openrouter", name: "OpenRouter", models: 100 },
      { id: "ollama", name: "Ollama", models: 50 },
      { id: "openai", name: "OpenAI", models: 20 },
      { id: "anthropic", name: "Anthropic", models: 10 },
    ],
  };
}

// Cost Analysis Skill
export const costAnalysisSkill = {
  id: "a2a.cost-analysis",
  name: "Cost Analysis",
  description: "Analyzes and optimizes LLM usage costs across agents",
  version: "1.0.0",
  category: "a2a",
  tags: ["cost", "analysis", "optimization", "billing"],
  author: "Company in a Box",
  license: "MIT",
  entryPoint: "costAnalysis",
  dependencies: [],
  configSchema: z.object({
    alertThreshold: z.number().default(10000), // cents
    reportInterval: z.number().default(86400000), // daily
  }),
  configDefaults: {
    alertThreshold: 10000,
    reportInterval: 86400000,
  },
  permissions: {
    canReadFiles: false,
    canWriteFiles: false,
    canExecuteCommands: false,
    canAccessNetwork: false,
    canAccessDatabase: true,
    canSpawnAgents: false,
    allowedPaths: [],
    deniedPaths: [],
  },
  metadata: {
    a2a: true,
    capability: "cost-analysis",
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export async function costAnalysis(input: {
  companyId: string;
  period: { start: number; end: number };
  config: any;
}): Promise<any> {
  // In a real implementation, this would query cost data from database
  return {
    totalCost: 0,
    totalTokens: 0,
    byProvider: {},
    byModel: {},
    byAgent: {},
    recommendations: [
      "Consider using cheaper models for simple tasks",
      "Implement caching for repeated queries",
    ],
  };
}

// Health Report Skill
export const healthReportSkill = {
  id: "a2a.health-report",
  name: "Health Report",
  description: "Generates health reports for agents and the overall system",
  version: "1.0.0",
  category: "a2a",
  tags: ["health", "monitoring", "reporting"],
  author: "Company in a Box",
  license: "MIT",
  entryPoint: "healthReport",
  dependencies: [],
  configSchema: z.object({
    includeDetails: z.boolean().default(true),
    format: z.enum(["json", "markdown", "html"]).default("json"),
  }),
  configDefaults: {
    includeDetails: true,
    format: "json",
  },
  permissions: {
    canReadFiles: false,
    canWriteFiles: false,
    canExecuteCommands: false,
    canAccessNetwork: true,
    canAccessDatabase: true,
    canSpawnAgents: false,
    allowedPaths: [],
    deniedPaths: [],
  },
  metadata: {
    a2a: true,
    capability: "health-reporting",
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export async function healthReport(input: {
  companyId: string;
  agentIds?: string[];
  config: any;
}): Promise<any> {
  // In a real implementation, this would gather health data from all agents
  return {
    overall: "healthy",
    timestamp: Date.now(),
    agents: [],
    summary: {
      total: 0,
      healthy: 0,
      degraded: 0,
      unhealthy: 0,
    },
  };
}

// Register all A2A skills
export function registerA2ASkills(): void {
  skillCatalog.registerSkill(smartRoutingSkill);
  skillCatalog.registerSkill(quotaManagementSkill);
  skillCatalog.registerSkill(providerDiscoverySkill);
  skillCatalog.registerSkill(costAnalysisSkill);
  skillCatalog.registerSkill(healthReportSkill);
}

// A2A Skill Definitions for Agent Cards
export const A2A_SKILLS = [
  {
    id: "smart-routing",
    name: "Smart Routing",
    description: "Routes tasks to the most appropriate agent based on capabilities, load, and priority",
    inputSchema: {
      type: "object",
      properties: {
        task: { type: "object" },
        availableAgents: { type: "array" },
        config: { type: "object" },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        selectedAgent: { type: "string" },
        reasoning: { type: "string" },
        confidence: { type: "number" },
      },
    },
    tags: ["routing", "delegation", "load-balancing"],
  },
  {
    id: "quota-management",
    name: "Quota Management",
    description: "Manages API quotas and rate limits across agents",
    inputSchema: {
      type: "object",
      properties: {
        agentId: { type: "string" },
        requestedTokens: { type: "number" },
        config: { type: "object" },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        allowed: { type: "boolean" },
        remaining: { type: "number" },
        resetAt: { type: "number" },
      },
    },
    tags: ["quota", "rate-limiting", "billing"],
  },
  {
    id: "provider-discovery",
    name: "Provider Discovery",
    description: "Discovers and registers available LLM providers and models",
    inputSchema: {
      type: "object",
      properties: {
        sources: { type: "array", items: { type: "string" } },
        config: { type: "object" },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        providers: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              models: { type: "number" },
            },
          },
        },
      },
    },
    tags: ["provider", "discovery", "models"],
  },
  {
    id: "cost-analysis",
    name: "Cost Analysis",
    description: "Analyzes and optimizes LLM usage costs across agents",
    inputSchema: {
      type: "object",
      properties: {
        companyId: { type: "string" },
        period: {
          type: "object",
          properties: {
            start: { type: "number" },
            end: { type: "number" },
          },
        },
        config: { type: "object" },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        totalCost: { type: "number" },
        totalTokens: { type: "number" },
        byProvider: { type: "object" },
        byModel: { type: "object" },
        byAgent: { type: "object" },
        recommendations: { type: "array", items: { type: "string" } },
      },
    },
    tags: ["cost", "analysis", "optimization", "billing"],
  },
  {
    id: "health-report",
    name: "Health Report",
    description: "Generates health reports for agents and the overall system",
    inputSchema: {
      type: "object",
      properties: {
        companyId: { type: "string" },
        agentIds: { type: "array", items: { type: "string" } },
        config: { type: "object" },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        overall: { type: "string" },
        timestamp: { type: "number" },
        agents: { type: "array" },
        summary: {
          type: "object",
          properties: {
            total: { type: "number" },
            healthy: { type: "number" },
            degraded: { type: "number" },
            unhealthy: { type: "number" },
          },
        },
      },
    },
    tags: ["health", "monitoring", "reporting"],
  },
];