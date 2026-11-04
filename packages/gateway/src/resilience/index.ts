import { ulid } from "ulid";
import { EventEmitter } from "events";

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number; // milliseconds
  halfOpenRequests: number;
}

export interface CircuitBreakerState {
  state: "closed" | "open" | "half-open";
  failures: number;
  successes: number;
  lastFailure: number;
  lastSuccess: number;
  nextAttempt: number;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
  retryableErrors: string[];
}

export interface RateLimitConfig {
  requestsPerWindow: number;
  windowMs: number;
  keyPrefix: string;
}

export interface ResilienceConfig {
  circuitBreaker: CircuitBreakerConfig;
  retry: RetryConfig;
  rateLimit: RateLimitConfig;
  timeout: number;
}

export class CircuitBreaker extends EventEmitter {
  private state: CircuitBreakerState;
  private config: CircuitBreakerConfig;
  private name: string;

  constructor(name: string, config: Partial<CircuitBreakerConfig> = {}) {
    super();
    this.name = name;
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      successThreshold: config.successThreshold || 2,
      timeout: config.timeout || 60000,
      halfOpenRequests: config.halfOpenRequests || 3,
    };
    this.state = {
      state: "closed",
      failures: 0,
      successes: 0,
      lastFailure: 0,
      lastSuccess: 0,
      nextAttempt: 0,
    };
  }

  async execute<T>(operation: () => Promise<any>): Promise<any> {
    if (this.state.state === "open") {
      if (Date.now() < this.state.nextAttempt) {
        throw new Error(`Circuit breaker ${this.name} is open`);
      }
      // Move to half-open
      this.state.state = "half-open";
      this.state.successes = 0;
      this.emit("halfOpen", this.name);
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.state.failures = 0;
    this.state.lastSuccess = Date.now();

    if (this.state.state === "half-open") {
      this.state.successes++;
      if (this.state.successes >= this.config.successThreshold) {
        this.state.state = "closed";
        this.state.failures = 0;
        this.state.successes = 0;
        this.emit("closed", this.name);
      }
    } else {
      this.state.state = "closed";
      this.state.failures = 0;
    }
  }

  private onFailure(): void {
    this.state.failures++;
    this.state.lastFailure = Date.now();

    if (this.state.state === "half-open") {
      // Any failure in half-open goes back to open
      this.state.state = "open";
      this.state.nextAttempt = Date.now() + this.config.timeout;
      this.emit("opened", this.name);
    } else if (this.state.failures >= this.config.failureThreshold) {
      this.state.state = "open";
      this.state.nextAttempt = Date.now() + this.config.timeout;
      this.emit("opened", this.name);
    }
  }

  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  reset(): void {
    this.state = {
      state: "closed",
      failures: 0,
      successes: 0,
      lastFailure: 0,
      lastSuccess: 0,
      nextAttempt: 0,
    };
  }

  isAvailable(): boolean {
    if (this.state.state === "closed") return true;
    if (this.state.state === "half-open") return true;
    if (this.state.state === "open" && Date.now() >= this.state.nextAttempt) {
      return true; // Will transition to half-open on next request
    }
    return false;
  }
}

export class RetryPolicy {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxAttempts: config.maxAttempts || 3,
      baseDelay: config.baseDelay || 1000,
      maxDelay: config.maxDelay || 30000,
      backoffMultiplier: config.backoffMultiplier || 2,
      retryableStatusCodes: config.retryableStatusCodes || [408, 429, 500, 502, 503, 504],
      retryableErrors: config.retryableErrors || ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "ENETUNREACH", "timeout"],
    };
  }

  async execute<T>(operation: () => Promise<any>): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        if (attempt === this.config.maxAttempts) {
          throw error;
        }

        if (!this.isRetryable(error)) {
          throw error;
        }

        const delay = this.calculateDelay(attempt);
        await this.sleep(delay);
      }
    }

    throw new Error("Retry exhausted");
  }

  private isRetryable(error: any): boolean {
    // Check status code
    if (error.statusCode && this.config.retryableStatusCodes.includes(error.statusCode)) {
      return true;
    }

    // Check error code
    if (error.code && this.config.retryableErrors.includes(error.code)) {
      return true;
    }

    // Check message
    const message = error.message?.toLowerCase() || "";
    for (const retryableError of this.config.retryableErrors) {
      if (message.includes(retryableError.toLowerCase())) {
        return true;
      }
    }

    return false;
  }

  private calculateDelay(attempt: number): number {
    const delay = Math.min(
      this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1),
      this.config.maxDelay
    );
    // Add jitter
    return delay + Math.random() * delay * 0.1;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      requestsPerWindow: config.requestsPerWindow || 100,
      windowMs: config.windowMs || 60000,
      keyPrefix: config.keyPrefix || "ratelimit",
    };
  }

  async checkLimit(key: string): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const fullKey = `${this.config.keyPrefix}:${key}`;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    let requests = this.requests.get(fullKey) || [];
    // Filter out old requests
    requests = requests.filter(timestamp => timestamp > windowStart);

    const allowed = requests.length < this.config.requestsPerWindow;
    const remaining = Math.max(0, this.config.requestsPerWindow - requests.length);
    const resetAt = now + this.config.windowMs;

    if (allowed) {
      requests.push(Date.now());
      this.requests.set(fullKey, requests);
    }

    return { allowed, remaining, resetAt };
  }

  async consume(key: string): Promise<boolean> {
    const result = await this.checkLimit(key);
    return result.allowed;
  }

  reset(key: string): void {
    const fullKey = `${this.config.keyPrefix}:${key}`;
    this.requests.delete(fullKey);
  }

  getStats(key: string): { count: number; oldest: number; newest: number } | null {
    const fullKey = `${this.config.keyPrefix}:${key}`;
    const requests = this.requests.get(fullKey);
    if (!requests || requests.length === 0) return null;

    return {
      count: requests.length,
      oldest: requests[0],
      newest: requests[requests.length - 1],
    };
  }
}

export class ResilienceManager extends EventEmitter {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private retryPolicies: Map<string, RetryPolicy> = new Map();
  private rateLimiters: Map<string, RateLimiter> = new Map();
  private defaultConfigs: {
    circuitBreaker: CircuitBreakerConfig;
    retry: RetryConfig;
    rateLimit: RateLimitConfig;
  };

  constructor() {
    this.defaultConfigs = {
      circuitBreaker: {
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 60000,
        halfOpenRequests: 3,
      },
      retry: {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        retryableStatusCodes: [408, 429, 500, 502, 503, 504],
        retryableErrors: ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "ENETUNREACH", "timeout"],
      },
      rateLimit: {
        requestsPerWindow: 100,
        windowMs: 60000,
        keyPrefix: "ratelimit",
      },
    };
  }

  getCircuitBreaker(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    let breaker = this.circuitBreakers.get(name);
    if (!breaker) {
      breaker = new CircuitBreaker(name, { ...this.defaultConfigs.circuitBreaker, ...config });
      breaker.on("opened", (name) => this.emit("circuitOpened", name));
      breaker.on("closed", (name) => this.emit("circuitClosed", name));
      breaker.on("halfOpen", (name) => this.emit("circuitHalfOpen", name));
      this.circuitBreakers.set(name, breaker);
    }
    return breaker;
  }

  getRetryPolicy(name: string, config?: Partial<RetryConfig>): RetryPolicy {
    let policy = this.retryPolicies.get(name);
    if (!policy) {
      policy = new RetryPolicy({ ...this.defaultConfigs.retry, ...config });
      this.retryPolicies.set(name, policy);
    }
    return policy;
  }

  getRateLimiter(name: string, config?: Partial<RateLimitConfig>): RateLimiter {
    let limiter = this.rateLimiters.get(name);
    if (!limiter) {
      limiter = new RateLimiter({ ...this.defaultConfigs.rateLimit, ...config });
      this.rateLimiters.set(name, limiter);
    }
    return limiter;
  }

  async executeWithResilience<T>(
    name: string,
    operation: () => Promise<any>,
    options: {
      circuitBreaker?: boolean;
      retry?: boolean;
      rateLimit?: boolean;
      rateLimitKey?: string;
    } = {}
  ): Promise<any> {
    const { circuitBreaker = true, retry = true, rateLimit = true, rateLimitKey = name } = options;

    // Rate limit check
    if (rateLimit) {
      const limiter = this.getRateLimiter(rateLimitKey);
      const allowed = await limiter.consume(rateLimitKey);
      if (!allowed) {
        throw new Error(`Rate limit exceeded for ${rateLimitKey}`);
      }
    }

    // Execute with circuit breaker and retry
    const breaker = circuitBreaker ? this.getCircuitBreaker(name) : null;
    const policy = retry ? this.getRetryPolicy(name) : null;

    const executeOperation = async (): Promise<any> => {
      return await operation();
    };

    if (breaker && policy) {
      return await breaker.execute(async () => {
        return await policy.execute(executeOperation);
      });
    } else if (breaker) {
      return await breaker.execute(executeOperation);
    } else if (policy) {
      return await policy.execute(executeOperation);
    } else {
      return await executeOperation();
    }
  }

  getAllCircuitStates(): Map<string, any> {
    const states = new Map();
    for (const [name, breaker] of this.circuitBreakers.entries()) {
      states.set(name, breaker.getState());
    }
    return states;
  }

  resetAll(): void {
    for (const breaker of this.circuitBreakers.values()) {
      breaker.reset();
    }
    this.circuitBreakers.clear();
    this.retryPolicies.clear();
    this.rateLimiters.clear();
  }
}

export const resilienceManager = new ResilienceManager();