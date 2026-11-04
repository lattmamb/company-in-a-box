import { ulid } from "ulid";
import { z } from "zod";

// ============================================================================
// A2A Protocol Types (JSON-RPC 2.0 based)
// ============================================================================

export const JSON_RPC_VERSION = "2.0" as const;

export const A2AMessageType = {
  REQUEST: "request",
  RESPONSE: "response",
  NOTIFICATION: "notification",
  ERROR: "error",
} as const;

export type A2AMessageType = typeof A2AMessageType[keyof typeof A2AMessageType];

// Base JSON-RPC message
export interface JSONRPCMessage {
  jsonrpc: typeof JSON_RPC_VERSION;
  id?: string | number | null;
}

// Request
export interface JSONRPCRequest extends JSONRPCMessage {
  method: string;
  params?: any;
}

// Response
export interface JSONRPCResponse extends JSONRPCMessage {
  result?: any;
  error?: JSONRPCError;
}

// Error
export interface JSONRPCError {
  code: number;
  message: string;
  data?: any;
}

// Notification
export interface JSONRPCNotification extends JSONRPCMessage {
  method: string;
  params?: any;
}

// ============================================================================
// A2A Specific Types
// ============================================================================

export interface AgentCard {
  name: string;
  description: string;
  version: string;
  capabilities: AgentCapability[];
  skills: AgentSkill[];
  endpoints: AgentEndpoint[];
  authentication: AuthenticationRequirement[];
  metadata: Record<string, any>;
}

export interface AgentCapability {
  name: string;
  description: string;
  inputSchema: any;
  outputSchema: any;
}

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  inputSchema: any;
  outputSchema: any;
  tags: string[];
}

export interface AgentEndpoint {
  url: string;
  protocol: "jsonrpc" | "grpc" | "rest";
  authentication?: AuthenticationRequirement;
}

export interface AuthenticationRequirement {
  type: "bearer" | "api_key" | "oauth2" | "mtls";
  schemes: string[];
  description?: string;
}

// Task types
export interface Task {
  id: string;
  type: string;
  status: TaskStatus;
  input: any;
  output?: any;
  error?: TaskError;
  createdAt: number;
  updatedAt: number;
  metadata: Record<string, any>;
}

export type TaskStatus = 
  | "pending" 
  | "running" 
  | "completed" 
  | "failed" 
  | "cancelled" 
  | "requires_input";

export interface TaskError {
  code: string;
  message: string;
  details?: any;
  recoverable: boolean;
}

// Task delegation
export interface DelegateTaskRequest {
  task: Omit<Task, "id" | "createdAt" | "updatedAt">;
  targetAgentId?: string;
  targetAgentCard?: AgentCard;
  timeout?: number;
  priority?: "low" | "normal" | "high" | "critical";
}

export interface DelegateTaskResponse {
  taskId: string;
  status: TaskStatus;
  estimatedCompletion?: number;
}

export interface TaskStatusRequest {
  taskId: string;
}

export interface TaskStatusResponse {
  task: Task;
}

export interface TaskCancelRequest {
  taskId: string;
  reason?: string;
}

export interface TaskCancelResponse {
  success: boolean;
  taskId: string;
}

// Skill discovery
export interface DiscoverSkillsRequest {
  agentId?: string;
  tags?: string[];
  capabilities?: string[];
}

export interface DiscoverSkillsResponse {
  skills: AgentSkill[];
}

// Agent health
export interface HealthCheckRequest {}

export interface HealthCheckResponse {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  uptime: number;
  checks: HealthCheck[];
}

export interface HealthCheck {
  name: string;
  status: "pass" | "warn" | "fail";
  message?: string;
  timestamp: number;
}

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const AgentCardSchema = z.object({
  name: z.string(),
  description: z.string(),
  version: z.string(),
  capabilities: z.array(z.object({
    name: z.string(),
    description: z.string(),
    inputSchema: z.any(),
    outputSchema: z.any(),
  })),
  skills: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    inputSchema: z.any(),
    outputSchema: z.any(),
    tags: z.array(z.string()),
  })),
  endpoints: z.array(z.object({
    url: z.string().url(),
    protocol: z.enum(["jsonrpc", "grpc", "rest"]),
    authentication: z.object({
      type: z.enum(["bearer", "api_key", "oauth2", "mtls"]),
      schemes: z.array(z.string()),
      description: z.string().optional(),
    }).optional(),
  })),
  authentication: z.array(z.object({
    type: z.enum(["bearer", "api_key", "oauth2", "mtls"]),
    schemes: z.array(z.string()),
    description: z.string().optional(),
  })),
  metadata: z.record(z.any()),
});

export const TaskSchema = z.object({
  id: z.string(),
  type: z.string(),
  status: z.enum(["pending", "running", "completed", "failed", "cancelled", "requires_input"]),
  input: z.any(),
  output: z.any().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
    recoverable: z.boolean(),
  }).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
  metadata: z.record(z.any()),
});

export const DelegateTaskRequestSchema = z.object({
  task: TaskSchema.omit({ id: true, createdAt: true, updatedAt: true }),
  targetAgentId: z.string().optional(),
  targetAgentCard: AgentCardSchema.optional(),
  timeout: z.number().optional(),
  priority: z.enum(["low", "normal", "high", "critical"]).optional(),
});

export const TaskStatusRequestSchema = z.object({
  taskId: z.string(),
});

export const TaskCancelRequestSchema = z.object({
  taskId: z.string(),
  reason: z.string().optional(),
});

export const DiscoverSkillsRequestSchema = z.object({
  agentId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  capabilities: z.array(z.string()).optional(),
});

export const HealthCheckRequestSchema = z.object({});

// Type exports
export type AgentCardType = z.infer<typeof AgentCardSchema>;
export type TaskType = z.infer<typeof TaskSchema>;
export type DelegateTaskRequestType = z.infer<typeof DelegateTaskRequestSchema>;
export type TaskStatusRequestType = z.infer<typeof TaskStatusRequestSchema>;
export type TaskCancelRequestType = z.infer<typeof TaskCancelRequestSchema>;
export type DiscoverSkillsRequestType = z.infer<typeof DiscoverSkillsRequestSchema>;
export type HealthCheckRequestType = z.infer<typeof HealthCheckRequestSchema>;