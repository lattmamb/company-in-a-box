"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ulid } from "ulid";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  toolCalls?: any[];
  toolResults?: any[];
  timestamp: number;
  metadata?: Record<string, any>;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  agentId?: string;
}

interface ChatContextType {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  loading: boolean;
  createSession: (agentId?: string) => Promise<string>;
  setCurrentSession: (sessionId: string) => void;
  sendMessage: (content: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  clearCurrentSession: () => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load sessions from localStorage
    const stored = localStorage.getItem("cib_chat_sessions");
    if (stored) {
      try {
        setSessions(JSON.parse(stored));
      } catch {
        localStorage.removeItem("cib_chat_sessions");
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    localStorage.setItem("cib_chat_sessions", JSON.stringify(sessions));
  }, [sessions]);

  const currentSession = sessions.find(s => s.id === currentSessionId) || null;

  const createSession = async (agentId?: string) => {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newSession: ChatSession = {
      id: sessionId,
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      agentId,
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(sessionId);
    return sessionId;
  };

  const setCurrentSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const sendMessage = async (content: string) => {
    if (!currentSessionId) return;

    const userMessage = {
      id: `msg-${Date.now()}`,
      role: "user" as const,
      content,
      timestamp: Date.now(),
    };

    setSessions(prev => prev.map(s => 
      s.id === currentSessionId 
        ? { ...s, messages: [...s.messages, { id: `msg-${Date.now()}`, role: "user", content, timestamp: Date.now() }], updatedAt: Date.now() }
        : s
    ));

    // In a real app, this would call the agent API
    // For now, simulate assistant response
    setTimeout(() => {
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { ...s, messages: [...s.messages, { id: `msg-${Date.now()}`, role: "assistant", content: "I'll help you with that. This is a simulated response.", timestamp: Date.now() }], updatedAt: Date.now() }
          : s
      ));
    }, 1000);
  };

  const deleteSession = async (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
    }
  };

  const clearCurrentSession = () => {
    setCurrentSessionId(null);
  };

  return (
    <ChatContext.Provider value={{ sessions, currentSession, loading, createSession, setCurrentSession, sendMessage, deleteSession, clearCurrentSession }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within ChatProvider");
  return context;
}