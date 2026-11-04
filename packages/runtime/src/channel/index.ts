import { EventEmitter } from "events";
import { ulid } from "ulid";

export interface Channel {
  id: string;
  type: "telegram" | "kimi" | "api" | "websocket" | "cli";
  name: string;
  config: Record<string, unknown>;
  status: "connected" | "disconnected" | "connecting" | "error";
  agentId?: string;
  companyId: string;
  createdAt: number;
  updatedAt: number;
  lastMessageAt?: number;
  metadata: Record<string, unknown>;
}

export interface ChannelMessage {
  id: string;
  channelId: string;
  direction: "inbound" | "outbound";
  from: string;
  to: string;
  content: string;
  type: "text" | "image" | "file" | "command" | "event";
  metadata: Record<string, unknown>;
  timestamp: number;
}

export interface ChannelAdapter {
  type: string;
  connect(config: Record<string, unknown>): Promise<void>;
  disconnect(): Promise<void>;
  send(message: ChannelMessage): Promise<void>;
  onMessage(handler: (message: ChannelMessage) => Promise<void>): void;
  onStatusChange(handler: (status: string) => void): void;
  getStatus(): string;
}

export class ChannelManager extends EventEmitter {
  private channels: Map<string, Channel> = new Map();
  private adapters: Map<string, ChannelAdapter> = new Map();
  private messageHandlers: Map<string, (message: ChannelMessage) => Promise<void>> = new Map();

  registerAdapter(adapter: ChannelAdapter): void {
    this.adapters.set(adapter.type, adapter);
  }

  async createChannel(input: {
    type: string;
    name: string;
    config: Record<string, unknown>;
    companyId: string;
    agentId?: string;
  }): Promise<Channel> {
    const adapter = this.adapters.get(input.type);
    if (!adapter) {
      throw new Error(`No adapter registered for channel type: ${input.type}`);
    }

    const channel: Channel = {
      id: ulid(),
      type: input.type as any,
      name: input.name,
      config: input.config,
      status: "connecting",
      agentId: input.agentId,
      companyId: input.companyId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: {},
    };

    this.channels.set(channel.id, channel);

    try {
      await adapter.connect(input.config);
      channel.status = "connected";
      channel.updatedAt = Date.now();

      // Set up message handler
      adapter.onMessage(async (message) => {
        await this.handleInboundMessage(channel.id, message);
      });

      adapter.onStatusChange((status) => {
        const ch = this.channels.get(channel.id);
        if (ch) {
          ch.status = status as any;
          ch.updatedAt = Date.now();
          this.emit("statusChange", ch);
        }
      });

      this.emit("channelCreated", channel);
      return channel;
    } catch (error) {
      channel.status = "error";
      channel.updatedAt = Date.now();
      throw error;
    }
  }

  async sendMessage(channelId: string, input: Omit<ChannelMessage, "id" | "channelId" | "timestamp">): Promise<ChannelMessage> {
    const channel = this.channels.get(channelId);
    if (!channel) throw new Error("Channel not found");
    if (channel.status !== "connected") {
      throw new Error(`Channel not connected: ${channel.status}`);
    }

    const adapter = this.adapters.get(channel.type);
    if (!adapter) throw new Error(`No adapter for channel type: ${channel.type}`);

    const message: ChannelMessage = {
      ...input,
      id: ulid(),
      channelId,
      timestamp: Date.now(),
    };

    await adapter.send(message);

    // Update channel
    channel.lastMessageAt = Date.now();
    channel.updatedAt = Date.now();

    this.emit("messageSent", message);
    return message;
  }

  async disconnectChannel(channelId: string): Promise<void> {
    const channel = this.channels.get(channelId);
    if (!channel) return;

    const adapter = this.adapters.get(channel.type);
    if (adapter) {
      await adapter.disconnect();
    }

    channel.status = "disconnected";
    channel.updatedAt = Date.now();
    this.emit("channelDisconnected", channel);
  }

  async deleteChannel(channelId: string): Promise<void> {
    await this.disconnectChannel(channelId);
    this.channels.delete(channelId);
  }

  getChannel(channelId: string): Channel | undefined {
    return this.channels.get(channelId);
  }

  listChannels(companyId: string, agentId?: string): Channel[] {
    let channels = Array.from(this.channels.values()).filter(c => c.companyId === companyId);
    if (agentId) {
      channels = channels.filter(c => c.agentId === agentId);
    }
    return channels.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  onMessage(channelId: string, handler: (message: ChannelMessage) => Promise<void>): void {
    this.messageHandlers.set(channelId, handler);
  }

  private async handleInboundMessage(channelId: string, message: ChannelMessage): Promise<void> {
    const channel = this.channels.get(channelId);
    if (!channel) return;

    channel.lastMessageAt = Date.now();
    channel.updatedAt = Date.now();

    const handler = this.messageHandlers.get(channelId);
    if (handler) {
      try {
        await handler(message);
      } catch (error) {
        console.error("Error handling inbound message:", error);
        this.emit("messageError", channelId, message, error);
      }
    }

    this.emit("messageReceived", channel, message);
  }

  async getChannelStats(companyId: string) {
    const channels = this.listChannels(companyId);
    return {
      total: channels.length,
      connected: channels.filter(c => c.status === "connected").length,
      disconnected: channels.filter(c => c.status === "disconnected").length,
      error: channels.filter(c => c.status === "error").length,
      byType: channels.reduce((acc, c) => {
        acc[c.type] = (acc[c.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

export const channelManager = new ChannelManager();