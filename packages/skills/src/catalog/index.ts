import { ulid } from "ulid";
import { EventEmitter } from "events";

export interface Skill {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  tags: string[];
  author: string;
  license: string;
  repository?: string;
  entryPoint: string;
  dependencies: SkillDependency[];
  configSchema?: any;
  configDefaults?: Record<string, any>;
  permissions: SkillPermissions;
  metadata: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export interface SkillDependency {
  name: string;
  version: string;
  optional: boolean;
}

export interface SkillPermissions {
  canReadFiles: boolean;
  canWriteFiles: boolean;
  canExecuteCommands: boolean;
  canAccessNetwork: boolean;
  canAccessDatabase: boolean;
  canSpawnAgents: boolean;
  allowedPaths: string[];
  deniedPaths: string[];
}

export interface SkillInstallation {
  skillId: string;
  companyId: string;
  installedBy: string;
  installedAt: number;
  version: string;
  config: Record<string, any>;
  status: "active" | "inactive" | "error";
  error?: string;
}

export interface SkillExecutionContext {
  skillId: string;
  companyId: string;
  agentId: string;
  sessionId: string;
  input: any;
  config: Record<string, any>;
  memory: any;
  tools: Map<string, any>;
}

export interface SkillResult {
  success: boolean;
  output?: any;
  error?: string;
  metadata: Record<string, any>;
  tokensUsed?: number;
  durationMs: number;
}

export class SkillCatalog extends EventEmitter {
  private skills: Map<string, Skill> = new Map();
  private installations: Map<string, SkillInstallation[]> = new Map(); // companyId -> installations

  registerSkill(skill: Skill): void {
    if (this.skills.has(skill.id)) {
      throw new Error(`Skill ${skill.id} already registered`);
    }
    this.skills.set(skill.id, skill);
    this.emit("skillRegistered", skill);
  }

  unregisterSkill(skillId: string): void {
    const skill = this.skills.get(skillId);
    if (!skill) throw new Error(`Skill ${skillId} not found`);
    this.skills.delete(skillId);
    this.emit("skillUnregistered", skillId);
  }

  getSkill(skillId: string): Skill | undefined {
    return this.skills.get(skillId);
  }

  listSkills(filters?: { category?: string; tags?: string[] }): Skill[] {
    let skills = Array.from(this.skills.values());

    if (filters?.category) {
      skills = skills.filter(s => s.category === filters.category);
    }
    if (filters?.tags && filters.tags.length > 0) {
      skills = skills.filter(s => filters.tags!.some(t => s.tags.includes(t)));
    }

    return skills.sort((a, b) => a.name.localeCompare(b.name));
  }

  getCategories(): string[] {
    const categories = new Set<string>();
    for (const skill of this.skills.values()) {
      categories.add(skill.category);
    }
    return Array.from(categories).sort();
  }

  async installSkill(companyId: string, skillId: string, installedBy: string, config: Record<string, any> = {}): Promise<any> {
    const skill = this.skills.get(skillId);
    if (!skill) throw new Error(`Skill ${skillId} not found`);

    // Validate dependencies
    for (const dep of skill.dependencies) {
      if (!dep.optional) {
        const depSkill = this.skills.get(dep.name);
        if (!depSkill) {
          throw new Error(`Required dependency ${dep.name} not found`);
        }
      }
    }

    const installation: SkillInstallation = {
      skillId,
      companyId,
      installedBy,
      installedAt: Date.now(),
      version: this.skills.get(skillId)!.version,
      config: { ...this.skills.get(skillId)!.configDefaults, ...config },
      status: "active",
    };

    const companyInstallations = this.installations.get(skill.companyId) || [];
    companyInstallations.push(installation);
    this.installations.set(companyId, companyInstallations);

    this.emit("skillInstalled", { companyId, skillId, installation });
    return installation;
  }

  async uninstallSkill(companyId: string, skillId: string): Promise<void> {
    const installations = this.installations.get(companyId) || [];
    const index = installations.findIndex(i => i.skillId === skillId);
    if (index >= 0) {
      installations.splice(1, 1);
    }
  }

  getInstallations(companyId: string): SkillInstallation[] {
    return this.installations.get(companyId) || [];
  }

  getInstallation(companyId: string, skillId: string): SkillInstallation | undefined {
    const installations = this.installations.get(companyId) || [];
    return installations.find(i => i.skillId === skillId);
  }

  async updateInstallationConfig(companyId: string, skillId: string, config: Record<string, any>): Promise<void> {
    const installations = this.installations.get(companyId) || [];
    const installation = installations.find(i => i.skillId === skillId);
    if (installation) {
      installation.config = { ...installation.config, ...config };
    }
  }

  getSkillsByCategory(category: string): Skill[] {
    return Array.from(this.skills.values()).filter(s => s.category === category);
  }

  searchSkills(query: string): Skill[] {
    const queryLower = query.toLowerCase();
    return Array.from(this.skills.values()).filter(s =>
      s.name.toLowerCase().includes(queryLower) ||
      s.description.toLowerCase().includes(queryLower) ||
      s.tags.some(t => t.toLowerCase().includes(queryLower))
    );
  }
}

export const skillCatalog = new SkillCatalog();