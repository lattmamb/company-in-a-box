export interface Provider {
  id: string;
  name: string;
  type: "openai" | "anthropic" | "google" | "openrouter" | "ollama" | "custom";
  baseUrl: string;
  apiKey?: string;
  models: ProviderModel[];
  headers?: Record<string, string>;
  enabled: boolean;
  priority: number;
  rateLimit?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}

export interface ProviderModel {
  id: string;
  name: string;
  contextWindow: number;
  maxOutputTokens: number;
  inputCostPer1k?: number;
  outputCostPer1k?: number;
  capabilities: ModelCapability[];
  reasoning?: boolean;
  vision?: boolean;
  functionCalling?: boolean;
}

export type ModelCapability = 
  | "chat" 
  | "completion" 
  | "embedding" 
  | "vision" 
  | "audio" 
  | "function_calling" 
  | "reasoning" 
  | "streaming";

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string | string[];
  stream?: boolean;
  tools?: Tool[];
  toolChoice?: "auto" | "none" | "required" | { type: "function"; function: { name: string } };
  responseFormat?: { type: "text" | "json_object" | "json_schema"; jsonSchema?: any };
  user?: string;
  metadata?: Record<string, unknown>;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | ChatMessageContent[];
  name?: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface ChatMessageContent {
  type: "text" | "image_url" | "audio";
  text?: string;
  imageUrl?: { url: string; detail?: "low" | "high" | "auto" };
  audio?: { data: string; format: string };
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface Tool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: any;
  };
}

export interface ChatResponse {
  id: string;
  object: "chat.completion" | "chat.completion.chunk";
  created: number;
  model: string;
  choices: ChatChoice[];
  usage?: Usage;
  systemFingerprint?: string;
}

export interface ChatChoice {
  index: number;
  message?: ChatMessage;
  delta?: ChatMessage;
  finishReason?: "stop" | "length" | "tool_calls" | "content_filter" | "function_call";
  logprobs?: any;
}

export interface Usage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  promptTokensDetails?: { cachedTokens: number };
  completionTokensDetails?: { reasoningTokens: number };
}

export interface EmbeddingRequest {
  model: string;
  input: string | string[];
  encodingFormat?: "float" | "base64";
  dimensions?: number;
  user?: string;
}

export interface EmbeddingResponse {
  object: "list";
  data: EmbeddingData[];
  model: string;
  usage: Usage;
}

export interface EmbeddingData {
  object: "embedding";
  index: number;
  embedding: number[];
}

export interface ModelListResponse {
  object: "list";
  data: ProviderModel[];
}