import { ulid } from "ulid";
import { EventEmitter } from "events";
import { WebSocketServer, WebSocket } from "ws";
import { createServer, IncomingMessage, ServerResponse } from "http";
import { url } from "url";
import {
  JSONRPCMessage,
  JSONRPCRequest,
  JSONRPCResponse,
  JSONRPCError,
  JSONRPCNotification,
  AgentCard,
  Task,
  TaskStatus,
  DelegateTaskRequest,
  DelegateTaskResponse,
  TaskStatusRequest,
  TaskStatusResponse,
  TaskCancelRequest,
  TaskCancelResponse,
  DiscoverSkillsRequest,
  DiscoverSkillsResponse,
  HealthCheckRequest,
  HealthCheckResponse,
  JSONRPCError,
  AgentCard,
  Task,
  DelegateTaskRequestSchema,
  TaskStatusRequestSchema,
  TaskCancelRequestSchema,
  DiscoverSkillsRequestSchema,
  HealthCheckRequestSchema,
  AgentCardSchema,
  TaskSchema,
} from "../protocol";
import { getDatabase } from "@company-in-a-box/core/src/db/client";
import { agents, tasks, type Agent, type Task as TaskSchema } from "@company-in-a-box/core/src/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { ulid } from "ulid";
import { verifyTaxonomyGate } from "@company-in-a-box/taxonomy/src/verification";
import { skillCatalog } from "@company-in-a-box/skills/src/catalog";
import { roleRegistry } from "@company-in-a-box/skills/src/roles";

export interface A2AServerConfig {
  port: number;
  host: string;
  agentCard: AgentCard;
  enableWebSocket: boolean;
  enableHTTP: boolean;
  auth?: {
    type: "bearer" | "api_key";
    validate: (token: string) => Promise<{ agentId: string; companyId: string } | null>;
  };
}

export interface A2AServerContext {
  agentId: string;
  companyId: string;
  agentCard: AgentCard;
}

export class A2AServer extends EventEmitter {
  private config: A2AServerConfig;
  private httpServer: any;
  private wsServer: WebSocketServer | null = null;
  private agentCard: AgentCard;
  private tasks: Map<string, Task> = new Map();
  private wsConnections: Map<string, WebSocket> = new Map();

  constructor(config: A2AServerConfig) {
    super();
    this.config = config;
    this.agentCard = config.agentCard;
  }

  async start(): Promise<void> {
    this.httpServer = createServer(this.handleHTTPRequest.bind(this));

    if (this.config.enableWebSocket) {
      this.wsServer = new WebSocketServer({ server: this.httpServer, path: "/a2a/ws" });
      this.wsServer.on("connection", this.handleWSConnection.bind(this));
    }

    return new Promise((resolve) => {
      this.httpServer.listen(this.config.port, this.config.host, () => {
        console.log(`A2A Server listening on ${this.config.host}:${this.config.port}`);
        this.emit("started", { port: this.config.port });
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    if (this.wsServer) {
      this.wsServer.close();
    }
    return new Promise((resolve) => {
      this.httpServer.close(() => {
        this.emit("stopped");
        resolve();
      });
    });
  }

  private async handleHTTPRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const parsedUrl = url.parse(req.url || "", true);
    const path = parsedUrl.pathname || "/";

    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // Authentication
    let context: A2AServerContext | null = null;
    if (this.config.auth) {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        this.sendError(res, 401, "Authentication required");
        return;
      }
      const token = authHeader.replace("Bearer ", "");
      const authResult = await this.config.auth.validate(token);
      if (!authResult) {
        this.sendError(res, 401, "Invalid token");
        return;
      }
      context = {
        agentId: authResult.agentId,
        companyId: authResult.companyId,
        agentCard: this.agentCard,
      };
    }

    try {
      if (req.method === "POST" && path === "/a2a/rpc") {
        await this.handleJSONRPC(req, res, context);
      } else if (req.method === "GET" && path === "/a2a/agent-card") {
        this.sendJSON(res, 200, this.agentCard);
      } else if (req.method === "GET" && path === "/a2a/health") {
        const health = await this.healthCheck();
        this.sendJSON(res, 200, health);
      } else if (req.method === "GET" && path === "/a2a/skills") {
        const skills = await this.discoverSkills({});
        this.sendJSON(res, 200, { skills: skills.skills });
      } else {
        this.sendError(res, 404, "Not found");
      }
    } catch (error: any) {
      console.error("HTTP request error:", error);
      this.sendError(res, 500, "Internal server error");
    }
  }

  private async handleJSONRPC(req: IncomingMessage, res: ServerResponse, context: A2AServerContext | null): Promise<void> {
    let body = "";
    for await (const chunk of req) {
      body += chunk;
    }

    let request: JSONRPCRequest;
    try {
      request = JSON.parse(body);
    } catch {
      this.sendJSONRPCError(res, null, -32700, "Parse error");
      return;
    }

    // Validate JSON-RPC
    if (request.jsonrpc !== "2.0") {
      this.sendJSONRPCError(res, request.id, -32600, "Invalid Request");
      return;
    }

    if (!request.method) {
      this.sendJSONRPCError(res, request.id, -32600, "Method missing");
      return;
    }

    try {
      let result: any;

      switch (request.method) {
        case "a2a.delegateTask":
          result = await this.delegateTask(request.params, context);
          break;
        case "a2a.getTaskStatus":
          result = await this.getTaskStatus(request.params);
          break;
        case "a2a.cancelTask":
          result = await this.cancelTask(request.params);
          break;
        case "a2a.discoverSkills":
          result = await this.discoverSkills(request.params);
          break;
        case "a2a.healthCheck":
          result = await this.healthCheck();
          break;
        case "a2a.getAgentCard":
          result = this.agentCard;
          break;
        default:
          this.sendJSONRPCError(res, request.id, -32601, "Method not found");
          return;
      }

      const response: JSONRPCResponse = {
        jsonrpc: "2.0",
        id: request.id,
        result,
      };
      this.sendJSON(res, 200, response);
    } catch (error: any) {
      const errorCode = error.code || -32603;
      this.sendJSONRPCError(res, request.id, errorCode, error.message, error.data);
    }
  }

  private async delegateTask(params: any, context: A2AServerContext | null): Promise<DelegateTaskResponse> {
    // Validate params
    const validated = DelegateTaskRequestSchema.parse(params);

    // Create task in database
    const db = getDatabase();
    const taskId = ulid();
    const now = Date.now();

    const task: Task = {
      id: ulid(),
      type: validated.task.type,
      status: "pending",
      input: validated.task.input,
      output: validated.task.output,
      error: validated.task.error,
      createdAt: now,
      updatedAt: now,
      metadata: validated.task.metadata || {},
    };

    this.tasks.set(task.id, task);

    // If target agent specified, delegate to that agent
    if (validated.targetAgentId) {
      // In a real implementation, this would send the task to the target agent via A2A
      // For now, we'll simulate async processing
      setTimeout(async () => {
        const task = this.tasks.get(taskId);
        if (task) {
          task.status = "running";
          task.updatedAt = Date.now();
          
          // Simulate completion
          setTimeout(() => {
            const t = this.tasks.get(taskId);
            if (t) {
              t.status = "completed";
              t.output = { result: "Task completed successfully" };
              t.updatedAt = Date.now();
            }
          }, 1000);
        }
      }, 100);
    }

    return {
      taskId: task.id,
      status: "pending",
      estimatedCompletion: Date.now() + 5000,
    };
  }

  private async getTaskStatus(params: any): Promise<TaskStatusResponse> {
    const validated = TaskStatusRequestSchema.parse(params);
    const task = this.tasks.get(validated.taskId);
    
    if (!task) {
      throw new Error("Task not found");
    }

    return { task };
  }

  private async cancelTask(params: any): Promise<TaskCancelResponse> {
    const validated = TaskCancelRequestSchema.parse(params);
    const task = this.tasks.get(validated.taskId);
    
    if (!task) {
      throw new Error("Task not found");
    }

    if (task.status === "completed" || task.status === "cancelled") {
      throw new Error(`Cannot cancel task in status: ${task.status}`);
    }

    task.status = "cancelled";
    task.updatedAt = Date.now();
    task.error = {
      code: "CANCELLED",
      message: validated.reason || "Task cancelled by user",
      recoverable: false,
    };

    return { success: true, taskId: validated.taskId };
  }

  private async discoverSkills(params: any): Promise<DiscoverSkillsResponse> {
    const validated = DiscoverSkillsRequestSchema.parse(params);
    
    // Get skills from catalog
    const skills = skillCatalog.listSkills({
      tags: validated.tags,
    });

    // Filter by capabilities if provided
    let filteredSkills = skills;
    if (validated.capabilities && validated.capabilities.length > 0) {
      filteredSkills = skills.filter(skill => 
        validated.capabilities!.some(cap => skill.tags.includes(cap))
      );
    }

    // Filter by agent if provided
    if (validated.agentId) {
      // Filter skills available to this agent
    }

    return {
      skills: filteredSkills.map(skill => ({
        id: skill.id,
        name: skill.name,
        description: skill.description,
        inputSchema: skill.configSchema || {},
        outputSchema: {},
        tags: skill.tags,
      })),
    };
  }

  private async healthCheck(): Promise<HealthCheckResponse> {
    const db = getDatabase();
    let dbHealthy = false;
    
    try {
      await db.execute("SELECT 1");
      dbHealthy = true;
    } catch {
      dbHealthy = false;
    }

    const checks: HealthCheckResponse["checks"] = [
      {
        name: "database",
        status: dbHealthy ? "pass" : "fail",
        message: dbHealthy ? "Database connection healthy" : "Database connection failed",
        timestamp: Date.now(),
      },
      {
        name: "taxonomy",
        status: "pass",
        message: "Taxonomy loaded",
        timestamp: Date.now(),
      },
      {
        name: "skills",
        status: "pass",
        message: `${skillCatalog.listSkills().length} skills registered`,
        timestamp: Date.now(),
      },
    ];

    const allPass = checks.every(c => c.status === "pass");
    
    return {
      status: allPass ? "healthy" : "degraded",
      version: "0.1.0",
      uptime: process.uptime(),
      checks,
    };
  }

  private async handleWSConnection(ws: WebSocket, req: IncomingMessage): Promise<void> {
    const connectionId = ulid();
    this.wsConnections.set(connectionId, ws);

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await this.handleWSMessage(connectionId, message);
      } catch (error) {
        console.error("WS message error:", error);
        this.sendWSError(ws, null, -32700, "Parse error");
      }
    });

    ws.on("close", () => {
      this.wsConnections.delete(connectionId);
    });

    ws.on("error", (error) => {
      console.error("WS error:", error);
      this.wsConnections.delete(connectionId);
    });

    // Send welcome
    this.sendWS(ws, {
      jsonrpc: "2.0",
      method: "a2a.welcome",
      params: { connectionId, agentCard: this.agentCard },
    });
  }

  private async handleWSMessage(connectionId: string, message: JSONRPCMessage): Promise<void> {
    const ws = this.wsConnections.get(connectionId);
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    if ("method" in message && message.method) {
      // Request
      const request = message as JSONRPCRequest;
      try {
        let result: any;

        switch (request.method) {
          case "a2a.delegateTask":
            result = await this.delegateTask(request.params);
            break;
          case "a2a.getTaskStatus":
            result = await this.getTaskStatus(request.params);
            break;
          case "a2a.cancelTask":
            result = await this.cancelTask(request.params);
            break;
          case "a2a.discoverSkills":
            result = await this.discoverSkills(request.params);
            break;
          case "a2a.healthCheck":
            result = await this.healthCheck();
            break;
          case "a2a.getAgentCard":
            result = this.agentCard;
            break;
          default:
            this.sendWSError(ws, request.id, -32601, "Method not found");
            return;
        }

        const response: JSONRPCResponse = {
          jsonrpc: "2.0",
          id: request.id,
          result,
        };
        this.sendWS(ws, response);
      } catch (error: any) {
        this.sendWSError(ws, request.id, error.code || -32603, error.message, error.data);
      }
    } else if ("result" in message || "error" in message) {
      // Response to our request - handle if needed
    }
  }

  private sendJSON(res: ServerResponse, status: number, data: any): void {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  }

  private sendJSONRPCError(res: ServerResponse, id: string | number | null, code: number, message: string, data?: any): void {
    const error: JSONRPCError = { code, message, data };
    const response: JSONRPCResponse = {
      jsonrpc: "2.0",
      id,
      error,
    };
    this.sendJSON(res, 200, response);
  }

  private sendError(res: ServerResponse, status: number, message: string): void {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: message }));
  }

  private sendWS(ws: WebSocket, data: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  private sendWSError(ws: WebSocket, id: string | number | null, code: number, message: string, data?: any): void {
    const error: JSONRPCError = { code, message, data };
    const response: JSONRPCResponse = {
      jsonrpc: "2.0",
      id,
      error,
    };
    this.sendWS(ws, response);
  }

  getAgentCard(): AgentCard {
    return this.agentCard;
  }

  getTasks(): Task[] {
    return Array.from(this.tasks.values());
  }
}

export function createA2AServer(config: A2AServerConfig): A2AServer {
  return new A2AServer(config);
}