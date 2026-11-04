import { ulid } from "ulid";
import { EventEmitter } from "events";
import {
  Provider,
  ProviderModel,
  ChatRequest,
  ChatResponse,
  ChatMessage,
  ChatChoice,
  Usage,
  ModelListResponse,
  ModelCapability,
} from "../types";

export interface RoutingStrategy {
  name: string;
  selectTargets(request: ChatRequest, providers: Provider[]): ProviderModel[];
}

export interface ComboStrategy extends RoutingStrategy {
  name: "priority" | "weighted" | "fill-first" | "round-robin" | "p2c" | "random" | "least-used" | "cost-optimized" | "reset-aware" | "reset-window" | "headroom" | "strict-random" | "auto" | "lkgp" | "context-optimized" | "cache-optimized" | "context-relay" | "fusion" | "pipeline";
}

export interface RoutingContext {
  request: ChatRequest;
  availableProviders: Provider[];
  strategy: ComboStrategy;
  fallbackChain: ProviderModel[];
}

export interface RoutingResult {
  targets: ProviderModel[];
  strategy: string;
  reasoning: string;
  fallbackChain: ProviderModel[];
}

export class ModelRouter extends EventEmitter {
  private providers: Map<string, Provider> = new Map();
  private strategies: Map<string, RoutingStrategy> = new Map();
  private defaultStrategy: ComboStrategy["name"] = "auto";

  constructor() {
    super();
    this.registerBuiltinStrategies();
  }

  registerProvider(provider: Provider): void {
    this.providers.set(provider.id, provider);
  }

  unregisterProvider(providerId: string): void {
    this.providers.delete(providerId);
  }

  getProvider(providerId: string): Provider | undefined {
    return this.providers.get(providerId);
  }

  listProviders(): Provider[] {
    return Array.from(this.providers.values()).filter(p => p.enabled);
  }

  registerStrategy(strategy: RoutingStrategy): void {
    this.strategies.set(strategy.name, strategy);
  }

  setDefaultStrategy(strategy: ComboStrategy["name"]): void {
    this.defaultStrategy = strategy;
  }

  getModels(): ProviderModel[] {
    const models: ProviderModel[] = [];
    for (const provider of this.providers.values()) {
      if (provider.enabled) {
        models.push(...provider.models.map(m => ({ ...m, providerId: provider.id })));
      }
    }
    return models;
  }

  async route(request: ChatRequest): Promise<{
    targets: Array<{ provider: string; model: string }>;
    strategy: string;
    fallbackChain: Array<{ provider: string; model: string }>;
  }> {
    const providers = this.listProviders();
    const strategy = this.strategies.get(this.defaultStrategy) || this.strategies.get("auto")!;
    
    const targets = strategy.selectTargets(request, providers);
    
    return {
      targets: targets.map(t => ({ provider: t.id, model: t.name })),
      strategy: this.defaultStrategy,
      fallbackChain: [],
    };
  }

  private registerBuiltinStrategies(): void {
    // Priority strategy - use highest priority provider
    this.registerStrategy({
      name: "priority",
      selectTargets: (request, providers) => {
        const sorted = providers
          .filter(p => p.enabled)
          .sort((a, b) => b.priority - a.priority);
        return sorted.flatMap(p => p.models.map(m => ({ ...m, providerId: p.id })));
      },
    });

    // Weighted strategy - distribute based on weights
    this.registerStrategy({
      name: "weighted",
      selectTargets: (request, providers) => {
        const enabled = providers.filter(p => p.enabled);
        const totalWeight = enabled.reduce((sum, p) => sum + p.priority, 0);
        // Simplified: just return all models weighted by priority
        return enabled.flatMap(p => p.models.map(m => ({ ...m, providerId: p.id })));
      },
    });

    // Auto strategy - intelligent routing based on request
    this.registerStrategy({
      name: "auto",
      selectTargets: (request, providers) => {
        const enabled = providers.filter(p => p.enabled);
        
        // Filter by capabilities needed
        const needsVision = request.messages.some(m => 
          Array.isArray(m.content) && m.content.some(c => c.type === "image_url")
        );
        const needsTools = !!request.tools && request.tools.length > 0;
        const needsReasoning = request.metadata?.needsReasoning === true;
        const needsStreaming = request.stream === true;

        let candidates = providers.filter(p => p.enabled);

        if (needsVision) {
          candidates = candidates.filter(p => p.models.some(m => m.capabilities.includes("vision")));
        }
        if (needsTools) {
          candidates = candidates.filter(p => p.models.some(m => m.capabilities.includes("function_calling")));
        }
        if (needsReasoning) {
          candidates = candidates.filter(p => p.models.some(m => m.reasoning === true));
        }
        if (needsStreaming) {
          candidates = candidates.filter(p => p.models.some(m => m.capabilities.includes("streaming")));
        }

        // Sort by priority
        candidates.sort((a, b) => b.priority - a.priority);

        return candidates.flatMap(p => p.models.map(m => ({ ...m, providerId: p.id })));
      },
    });

    // Cost-optimized strategy
    this.registerStrategy({
      name: "cost-optimized",
      selectTargets: (request, providers) => {
        const enabled = providers.filter(p => p.enabled);
        // Sort by cost (cheapest first)
        const withCost = enabled.flatMap(p => 
          p.models
            .filter(m => m.inputCostPer1k !== undefined && m.outputCostPer1k !== undefined)
            .map(m => ({ ...m, providerId: p.id, costScore: (m.inputCostPer1k || 0) + (m.outputCostPer1k || 0) }))
        );
        withCost.sort((a, b) => a.costScore - b.costScore);
        return withCost;
      },
    });

    // Fusion strategy - fan out to multiple models, then synthesize
    this.registerStrategy({
      name: "fusion",
      selectTargets: (request, providers) => {
        const enabled = providers.filter(p => p.enabled);
        // Return top 3 models from different providers for fusion
        const models = enabled.flatMap(p => p.models.map(m => ({ ...m, providerId: p.id })));
        // Group by provider, take best from each
        const byProvider = new Map<string, typeof models[0]>();
        for (const model of models) {
          const existing = byProvider.get(model.providerId);
          if (!existing || (model.inputCostPer1k || 0) < (existing.inputCostPer1k || 0)) {
            byProvider.set(model.providerId, model);
          }
        }
        return Array.from(byProvider.values()).slice(0, 3);
      },
    });
  }
}

export const modelRouter = new ModelRouter();