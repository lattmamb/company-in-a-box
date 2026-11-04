import { ulid } from "ulid";
import { getDatabase } from "@company-in-a-box/core/src/db/client";
import { agents, type Agent } from "@company-in-a-box/core/src/db/schema";
import { eq, and, desc } from "drizzle-orm";

export interface Session {
  id: string;
  agentId: string;
  companyId: string;
  status: "active" | "idle" | "terminated";
  context: SessionContext;
  createdAt: number;
  updatedAt: number;
  lastActivityAt: number;
  metadata: Record<string, unknown>;
}

export interface SessionContext {
  messages: SessionMessage[];
  tools: SessionTool[];
  variables: Record<string, unknown>;
  workingDirectory: string;
}

export interface SessionMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  name: string;
  result: unknown;
  error?: string;
}

export interface SessionTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  enabled: boolean;
}

export interface CreateSessionInput {
  agentId: string;
  companyId: string;
  initialContext?: Partial<SessionContext>;
  metadata?: Record<string, unknown>;
}

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private db = getDatabase();

  async createSession(input: CreateSessionInput): Promise<Session> {
    // Verify agent exists and is ready
    const agent = await this.getAgent(input.agentId);
    if (!agent) throw new Error("Agent not found");
    if (agent.companyId !== input.companyId) throw new Error("Agent not in company");
    if (agent.status !== "idle" && agent.status !== "running") {
      throw new Error(`Agent status is ${agent.status}, cannot create session`);
    }

    const session: Session = {
      id: ulid(),
      agentId: input.agentId,
      companyId: input.companyId,
      status: "active",
      context: {
        messages: [],
        tools: [],
        variables: {},
        workingDirectory: process.cwd(),
        ...input.initialContext,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastActivityAt: Date.now(),
      metadata: input.metadata || {},
    };

    this.sessions.set(session.id, session);

    // Update agent status
    await this.updateAgentStatus(input.agentId, "running");

    return session;
  }

  async getSession(sessionId: string): Promise<Session | null> {
    // Check memory first
    const cached = this.sessions.get(sessionId);
    if (cached) return cached;

    // TODO: Load from database if not in memory
    return null;
  }

  async updateSession(sessionId: string, updates: Partial<Session>): Promise<Session | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const updated = { ...session, ...updates, updatedAt: Date.now(), lastActivityAt: Date.now() };
    this.sessions.set(sessionId, updated);
    return updated;
  }

  async addMessage(sessionId: string, message: Omit<SessionMessage, "id" | "timestamp">): Promise<SessionMessage> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error("Session not found");

    const message: SessionMessage = {
      ...message,
      id: ulid(),
      timestamp: Date.now(),
    };

    session.context.messages.push(message);
    session.lastActivityAt = Date.now();
    session.updatedAt = Date.now();

    return message;
  }

  async addToolCall(sessionId: string, toolCall: ToolCall): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error("Session not found");

    const lastMessage = session.context.messages[session.context.messages.length - 1];
    if (lastMessage && lastMessage.role === "assistant") {
      lastMessage.toolCalls = [...(lastMessage.toolCalls || []), toolCall];
    }
  }

  async addToolResult(sessionId: string, toolResult: ToolResult): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error("Session not found");

    const lastMessage = session.context.messages[session.context.messages.length - 1];
    if (lastMessage && lastMessage.role === "assistant") {
      lastMessage.toolResults = [...(lastMessage.toolResults || []), toolResult];
    }
  }

  async registerTool(sessionId: string, tool: SessionTool): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error("Session not found");

    const existingIndex = session.context.tools.findIndex(t => t.name === tool.name);
    if (existingIndex >= 0) {
      session.context.tools[existingIndex] = tool;
    } else {
      session.context.tools.push(tool);
    }
  }

  async setVariable(sessionId: string, key: string, value: unknown): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error("Session not found");
    session.context.variables[key] = value;
  }

  async getVariable(sessionId: string, key: string): Promise<unknown> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error("Session not found");
    return session.context.variables[key];
  }

  async terminateSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.status = "terminated";
    session.updatedAt = Date.now();

    // Update agent status
    await this.updateAgentStatus(session.agentId, "idle");

    this.sessions.delete(sessionId);
  }

  async pauseSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error("Session not found");

    session.status = "idle";
    session.updatedAt = Date.now();
    await this.updateAgentStatus(session.agentId, "idle");
  }

  async resumeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error("Session not found");

    session.status = "active";
    session.updatedAt = Date.now();
    await this.updateAgentStatus(session.agentId, "running");
  }

  private async getAgent(agentId: string) {
    // This would use the core agents module
    // For now, return a mock
    return { id: "mock", companyId: "mock", status: "idle" } as any;
  }

  private async updateAgentStatus(agentId: string, status: "idle" | "running" | "paused" | "terminated") {
    // This would use the core agents module
    // For now, just a placeholder
  }

  async listSessions(companyId: string, agentId?: string): Promise<Session[]> {
    let sessions = Array.from(this.sessions.values()).filter(s => s.companyId === companyId);
    if (agentId) {
      sessions = sessions.filter(s => s.agentId === agentId);
    }
    return sessions.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async cleanupInactiveSessions(maxInactiveMs = 3600000): Promise<number> {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, session] of this.sessions.entries()) {
      if (now - session.lastActivityAt > maxInactiveMs) {
        await this.terminateSession(id);
        cleaned++;
      }
    }

    return cleaned;
  }
}

export const sessionManager = new SessionManager();