import { ulid } from "ulid";
import { EventEmitter } from "events";

export interface CostEntry {
  id: string;
  companyId: string;
  agentId?: string;
  providerId: string;
  modelId: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  currency: string;
  requestId: string;
  timestamp: number;
}

export interface Budget {
  id: string;
  companyId: string;
  agentId?: string;
  name: string;
  limit: number; // in cents
  spent: number; // in cents
  period: "daily" | "weekly" | "monthly" | "yearly";
  startDate: number;
  endDate: number;
  alertThreshold: number; // percentage (0-100)
  alertSent: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CostSummary {
  totalCost: number;
  totalTokens: number;
  byProvider: Record<string, { cost: number; tokens: number; requests: number }>;
  byModel: Record<string, { cost: number; tokens: number; requests: number }>;
  byAgent: Record<string, { cost: number; tokens: number; requests: number }>;
  period: { start: number; end: number };
}

export interface BudgetAlert {
  budgetId: string;
  budgetName: string;
  companyId: string;
  agentId?: string;
  spent: number;
  limit: number;
  percentage: number;
  threshold: number;
  timestamp: number;
}

export class CostTracker extends EventEmitter {
  private costs: Map<string, CostEntry[]> = new Map(); // companyId -> costs
  private budgets: Map<string, Budget[]> = new Map(); // companyId -> budgets

  recordCost(entry: Omit<CostEntry, "id">): CostEntry {
    const costEntry: CostEntry = {
      ...entry,
      id: ulid(),
    };

    const companyCosts = this.costs.get(entry.companyId) || [];
    companyCosts.push(costEntry);
    this.costs.set(entry.companyId, companyCosts);

    // Check budgets
    this.checkBudgets(costEntry);

    this.emit("costRecorded", costEntry);
    return costEntry;
  }

  async getCosts(companyId: string, startTime: number, endTime: number): Promise<CostEntry[]> {
    const costs = this.costs.get(companyId) || [];
    return costs.filter(c => c.timestamp >= startTime && c.timestamp <= endTime);
  }

  async getCostSummary(companyId: string, startTime: number, endTime: number): Promise<CostSummary> {
    const costs = await this.getCosts(companyId, startTime, endTime);

    const summary: CostSummary = {
      totalCost: 0,
      totalTokens: 0,
      byProvider: {},
      byModel: {},
      byAgent: {},
      period: { start: startTime, end: endTime },
    };

    for (const cost of costs) {
      summary.totalCost += cost.totalCost;
      summary.totalTokens += cost.totalTokens;

      // By provider
      if (!summary.byProvider[cost.providerId]) {
        summary.byProvider[cost.providerId] = { cost: 0, tokens: 0, requests: 0 };
      }
      summary.byProvider[cost.providerId].cost += cost.totalCost;
      summary.byProvider[cost.providerId].tokens += cost.totalTokens;
      summary.byProvider[cost.providerId].requests += 1;

      // By model
      if (!summary.byModel[cost.modelId]) {
        summary.byModel[cost.modelId] = { cost: 0, tokens: 0, requests: 0 };
      }
      summary.byModel[cost.modelId].cost += cost.totalCost;
      summary.byModel[cost.modelId].tokens += cost.totalTokens;
      summary.byModel[cost.modelId].requests += 1;

      // By agent
      if (cost.agentId) {
        if (!summary.byAgent[cost.agentId]) {
          summary.byAgent[cost.agentId] = { cost: 0, tokens: 0, requests: 0 };
        }
        summary.byAgent[cost.agentId].cost += cost.totalCost;
        summary.byAgent[cost.agentId].tokens += cost.totalTokens;
        summary.byAgent[cost.agentId].requests += 1;
      }
    }

    return summary;
  }

  createBudget(input: Omit<Budget, "id" | "spent" | "alertSent" | "createdAt" | "updatedAt">): Budget {
    const budget: Budget = {
      ...input,
      id: ulid(),
      spent: 0,
      alertSent: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const companyBudgets = this.budgets.get(budget.companyId) || [];
    companyBudgets.push(budget);
    this.budgets.set(budget.companyId, companyBudgets);

    this.emit("budgetCreated", budget);
    return budget;
  }

  async getBudgets(companyId: string): Promise<Budget[]> {
    return this.budgets.get(companyId) || [];
  }

  async getBudget(budgetId: string): Promise<Budget | null> {
    for (const budgets of this.budgets.values()) {
      const budget = budgets.find(b => b.id === budgetId);
      if (budget) return budget;
    }
    return null;
  }

  async updateBudgetSpending(budgetId: string, amount: number): Promise<void> {
    for (const budgets of this.budgets.values()) {
      const budget = budgets.find(b => b.id === budgetId);
      if (budget) {
        budget.spent += amount;
        budget.updatedAt = Date.now();

        // Check alert threshold
        const percentage = (budget.spent / budget.limit) * 100;
        if (percentage >= budget.alertThreshold && !budget.alertSent) {
          budget.alertSent = true;
          this.emit("budgetAlert", {
            budgetId: budget.id,
            budgetName: budget.name,
            companyId: budget.companyId,
            agentId: budget.agentId,
            spent: budget.spent,
            limit: budget.limit,
            percentage,
            threshold: budget.alertThreshold,
            timestamp: Date.now(),
          } as BudgetAlert);
        }
        break;
      }
    }
  }

  async deleteBudget(budgetId: string): Promise<void> {
    for (const [companyId, budgets] of this.budgets.entries()) {
      const index = budgets.findIndex(b => b.id === budgetId);
      if (index >= 0) {
        budgets.splice(index, 1);
        this.emit("budgetDeleted", { budgetId, companyId });
        break;
      }
    }
  }

  private checkBudgets(cost: CostEntry): void {
    const budgets = this.budgets.get(cost.companyId) || [];
    for (const budget of budgets) {
      // Check if budget applies to this cost
      const appliesToAgent = !budget.agentId || budget.agentId === cost.agentId;
      const inPeriod = cost.timestamp >= budget.startDate && cost.timestamp <= budget.endDate;

      if (appliesToAgent && inPeriod) {
        budget.spent += cost.totalCost;
        budget.updatedAt = Date.now();

        const percentage = (budget.spent / budget.limit) * 100;
        if (percentage >= budget.alertThreshold && !budget.alertSent) {
          budget.alertSent = true;
          this.emit("budgetAlert", {
            budgetId: budget.id,
            budgetName: budget.name,
            companyId: budget.companyId,
            agentId: budget.agentId,
            spent: budget.spent,
            limit: budget.limit,
            percentage,
            threshold: budget.alertThreshold,
            timestamp: Date.now(),
          } as BudgetAlert);
        }
      }
    }
  }

  async getCostTrends(companyId: string, days: number = 30): Promise<Array<{ date: string; cost: number; tokens: number }>> {
    const endTime = Date.now();
    const startTime = endTime - days * 24 * 60 * 60 * 1000;
    const costs = await this.getCosts(companyId, startTime, endTime);

    const daily: Record<string, { cost: number; tokens: number }> = {};

    for (const cost of costs) {
      const date = new Date(cost.timestamp).toISOString().split("T")[0];
      if (!daily[date]) {
        daily[date] = { cost: 0, tokens: 0 };
      }
      daily[date].cost += cost.totalCost;
      daily[date].tokens += cost.totalTokens;
    }

    return Object.entries(daily)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}

export const costTracker = new CostTracker();