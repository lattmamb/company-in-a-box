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
  Tool,
} from "../types";

export interface ExecutorConfig {
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  circuitBreakerThreshold: number;
  circuitBreakerResetMs: number;
}

export interface ExecutionResult {
  success: boolean;
  response?: ChatResponse;
  error?: ExecutionError;
  latencyMs: number;
  providerId: string;
  modelId: string;
  attempt: number;
}

export interface ExecutionError {
  code: string;
  message: string;
  statusCode?: number;
  retryable: boolean;
  providerId: string;
  modelId: string;
}

export interface ExecutorCircuitBreakerState {
  state: "closed" | "open" | "half-open";
  failures: number;
  lastFailure: number;
  nextAttempt: number;
}

export class ProviderExecutor extends EventEmitter {
  private circuitBreakers: Map<string, ExecutorCircuitBreakerState> = new Map();
  private config: ExecutorConfig;

  constructor(config: Partial<ExecutorConfig> = {}) {
    super();
    this.config = {
      timeout: config.timeout || 60000,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      circuitBreakerThreshold: config.circuitBreakerThreshold || 5,
      circuitBreakerResetMs: config.circuitBreakerResetMs || 60000,
    };
  }

  async execute(
    provider: any,
    model: any,
    request: any
  ): Promise<any> {
    const circuitKey = `${provider.id}:${request.model}`;
    const circuit = this.getCircuitBreaker(circuitKey);

    if (circuit.state === "open") {
      if (Date.now() < circuit.nextAttempt) {
        throw new Error(`Circuit breaker open for ${circuitKey}`);
      }
      // Move to half-open
      circuit.state = "half-open";
    }

    const startTime = Date.now();
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= this.config.maxRetries) {
      attempt++;
      try {
        const response = await this.makeRequest(provider, request);
        
        // Success - reset circuit breaker
        this.onSuccess(circuitKey);
        
        return {
          success: true,
          response,
          latencyMs: Date.now() - startTime,
          providerId: provider.id,
          modelId: request.model,
          attempt,
        };
      } catch (error: any) {
        lastError = error;
        
        // Check if error is retryable
        if (!this.isRetryable(error)) {
          this.onFailure(circuitKey);
          throw error;
        }

        // Check if we should retry
        if (attempt <= this.config.maxRetries) {
          await this.sleep(this.config.retryDelay * attempt);
          continue;
        }
      }
    }

    // All retries exhausted
    this.onFailure(circuitKey);
    throw lastError;
  }

  private async makeRequest(provider: any, request: any): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...provider.headers,
      };

      if (provider.apiKey) {
        headers["Authorization"] = `Bearer ${provider.apiKey}`;
      }

      const response = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`HTTP ${response.status}: ${errorText}`) as any;
        error.statusCode = response.status;
        error.providerResponse = errorText;
        throw error;
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new Error("Request timeout");
      }
      throw error;
    }
  }

  private isRetryable(error: any): boolean {
    // Network errors are retryable
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      return true;
    }
    // Timeout is retryable
    if (error.message.includes("timeout")) {
      return true;
    }
    // 5xx errors are retryable
    if (error.statusCode >= 500 && error.statusCode < 600) {
      return true;
    }
    // 429 (rate limit) is retryable
    if (error.statusCode === 429) {
      return true;
    }
    // 408 (timeout) is retryable
    if (error.statusCode === 408) {
      return true;
    }
    return false;
  }

  private getCircuitBreaker(key: string): ExecutorCircuitBreakerState {
    let circuit = this.circuitBreakers.get(key);
    if (!circuit) {
      circuit = {
        state: "closed",
        failures: 0,
        lastFailure: 0,
        nextAttempt: 0,
      };
      this.circuitBreakers.set(key, circuit);
    }
    return circuit;
  }

  private onSuccess(key: string): void {
    const circuit = this.circuitBreakers.get(key);
    if (circuit) {
      circuit.failures = 0;
      circuit.state = "closed";
      this.emit("circuitClosed", key);
    }
  }

  private onFailure(key: string): void {
    const circuit = this.circuitBreakers.get(key);
    if (circuit) {
      circuit.failures++;
      circuit.lastFailure = Date.now();
      
      if (circuit.failures >= 5) { // threshold
        circuit.state = "open";
        circuit.nextAttempt = Date.now() + 60000; // 1 minute
        this.emit("circuitOpened", key);
      }
    }
  }

  getCircuitState(key: string): ExecutorCircuitBreakerState | undefined {
    return this.circuitBreakers.get(key);
  }

  getAllCircuitStates(): Map<string, ExecutorCircuitBreakerState> {
    return new Map(this.circuitBreakers);
  }

  resetCircuit(key: string): void {
    this.circuitBreakers.delete(key);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const providerExecutor = new ProviderExecutor();