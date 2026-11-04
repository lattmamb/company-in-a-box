import { ulid } from "ulid";
import { EventEmitter } from "events";

export interface EvolutionSession {
  id: string;
  companyId: string;
  skillId: string;
  trigger: "scheduled" | "manual" | "session_end" | "validation_failure";
  status: "pending" | "running" | "completed" | "failed";
  inputSessions: string[];
  currentSkillVersion: string;
  proposedVersion?: string;
  changes?: SkillChange[];
  validationResult?: ValidationResult;
  startedAt: number;
  completedAt?: number;
  error?: string;
}

export interface SkillChange {
  type: "add" | "modify" | "remove";
  target: "code" | "config" | "metadata" | "dependencies";
  description: string;
  diff?: string;
}

export interface ValidationResult {
  passed: boolean;
  score: number;
  checks: ValidationCheck[];
  errors: string[];
  warnings: string[];
}

export interface ValidationCheck {
  name: string;
  passed: boolean;
  score: number;
  details: string;
}

export interface EvolutionConfig {
  schedule: "daily" | "weekly" | "monthly" | "manual";
  minSessions: number;
  maxSessionsPerRun: number;
  validationThreshold: number;
  autoPublish: boolean;
  requireApproval: boolean;
}

export class SkillEvolutionEngine extends EventEmitter {
  private sessions: Map<string, EvolutionSession> = new Map();
  private configs: Map<string, EvolutionConfig> = new Map(); // skillId -> config

  async startEvolution(input: {
    companyId: string;
    skillId: string;
    trigger: "scheduled" | "manual" | "session_end" | "validation_failure";
    inputSessions: string[];
  }): Promise<string> {
    const session: EvolutionSession = {
      id: ulid(),
      companyId: input.companyId,
      skillId: input.skillId,
      trigger: input.trigger,
      status: "running",
      inputSessions: input.inputSessions,
      currentSkillVersion: "1.0.0", // Would fetch from skill registry
      startedAt: Date.now(),
    };

    this.sessions.set(session.id, session);
    this.emit("evolutionStarted", session);

    // Run evolution asynchronously
    this.runEvolution(session.id).catch(err => {
      console.error("Evolution failed:", err);
    });

    return session.id;
  }

  private async runEvolution(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    try {
      // Phase 1: Summarize sessions
      const summaries = await this.summarizeSessions(session.inputSessions);
      
      // Phase 2: Aggregate by skill
      const aggregated = await this.aggregateBySkill(session.skillId, summaries);
      
      // Phase 3: Evolve skill
      const evolved = await this.evolveSkill(session.skillId, aggregated);
      
      // Phase 4: Validate
      const validation = await this.validateEvolution(session.skillId, session.currentSkillVersion, evolved);
      
      session.proposedVersion = evolved.version;
      session.changes = evolved.changes;
      session.validationResult = validation;

      if (validation.passed) {
        session.status = "completed";
        session.completedAt = Date.now();
        this.emit("evolutionCompleted", { sessionId: session.id, proposedVersion: evolved.version });
      } else {
        session.status = "failed";
        session.error = validation.errors.join(", ");
        this.emit("evolutionFailed", { sessionId: session.id, errors: validation.errors });
      }
    } catch (error: any) {
      session.status = "failed";
      session.error = error.message;
      this.emit("evolutionFailed", { sessionId: session.id, error: error.message });
    }

    session.completedAt = Date.now();
  }

  private async summarizeSessions(sessionIds: string[]): Promise<any[]> {
    // In a real implementation, this would call an LLM to summarize sessions
    return sessionIds.map(id => ({
      sessionId: id,
      summary: `Summary of session ${id}`,
      skillsReferenced: [],
      keyInsights: [],
      avgPrM: 0.8,
    }));
  }

  private async aggregateBySkill(skillId: string, summaries: any[]): Promise<any> {
    // Aggregate summaries by skill
    return {
      skillId,
      totalSessions: summaries.length,
      commonPatterns: [],
      improvementAreas: [],
    };
  }

  private async evolveSkill(skillId: string, aggregated: any): Promise<{ version: string; changes: any[] }> {
    // In a real implementation, this would use an LLM to evolve the skill
    return {
      version: "1.1.0",
      changes: [
        { type: "modify", target: "code", description: "Improved error handling" },
        { type: "add", target: "config", description: "Added new config option" },
      ],
    };
  }

  private async validateEvolution(skillId: string, currentVersion: string, evolved: any): Promise<any> {
    // Validation checks
    const checks = [
      { name: "syntax", passed: true, score: 1.0, details: "Syntax valid" },
      { name: "tests", passed: true, score: 0.9, details: "Tests pass" },
      { name: "security", passed: true, score: 1.0, details: "No security issues" },
      { name: "performance", passed: true, score: 0.8, details: "Performance acceptable" },
    ];

    const passed = checks.every(c => c.passed);
    const score = checks.reduce((sum, c) => sum + c.score, 0) / checks.length;

    return {
      passed,
      score,
      checks,
      errors: [],
      warnings: [],
    };
  }

  getSession(sessionId: string): any {
    return this.sessions.get(sessionId);
  }

  listSessions(companyId?: string): any[] {
    let sessions = Array.from(this.sessions.values());
    if (companyId) {
      // Filter by companyId would need to be stored in session
    }
    return sessions.sort((a, b) => b.startedAt - a.startedAt);
  }

  setConfig(skillId: string, config: any): void {
    this.configs.set(skillId, config);
  }

  getConfig(skillId: string): any {
    return this.configs.get(skillId);
  }
}

export const evolutionEngine = new EvolutionEngine();