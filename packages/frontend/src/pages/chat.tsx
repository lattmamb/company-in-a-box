"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChat } from "@/contexts/chat-context";
import { useAuth } from "@/contexts/auth-context";
import { Send, Bot, User, MoreVertical, Paperclip, Mic, X, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ulid } from "ulid";

interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  timestamp: number;
  toolCalls?: any[];
  toolResults?: any[];
}

export function Chat() {
  const { currentSession, createSession, setCurrentSession, sendMessage, sessions, deleteSession } = useChat();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentSessionMessages = currentSession?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSessionMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentSession) return;
    sendMessage(message);
    setMessage("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (message.trim() && currentSession) {
        sendMessage(message);
        setMessage("");
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleNewChat = async () => {
    const sessionId = await createSession();
    setCurrentSession(sessionId);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (confirm("Delete this conversation?")) {
      await deleteSession(sessionId);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={cn(
        "w-72 bg-white border-r border-gray-200 flex flex-col",
        "hidden lg:block"
      )}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Chats</h2>
            <Button variant="ghost" size="sm" onClick={handleNewChat}>
              <Bot className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {sessions.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No conversations yet. Start a new chat!
              </div>
            ) : sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => setCurrentSession(session.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-colors",
                  currentSession?.id === session.id
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <div className="flex items-start justify-between space-x-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {session.title || "New Chat"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {session.messages[0]?.content.slice(0, 50) || "No messages yet"}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(session.id);
                    }}
                    className="text-gray-400 hover:text-red-500 p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar} alt="" />
              <AvatarFallback>{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            <div className="flex items-center space-x-4">
              {currentSession ? (
                <>
                  <Bot className="h-6 w-6 text-primary-600" />
                  <div>
                    <h1 className="font-semibold text-gray-900">{currentSession.title || "New Chat"}</h1>
                    <p className="text-xs text-gray-500">
                      {currentSession.messages.length} messages
                    </p>
                  </div>
                </>
              ) : (
                <h1 className="text-lg font-semibold text-gray-900">Select a chat or start a new one</h1>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Messages */}
        <main className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 lg:p-8 space-y-6 max-w-3xl mx-auto w-full">
              {currentSession ? (
                currentSessionMessages.length === 0 ? (
                  <div className="text-center py-12">
                    <Bot className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">How can I help?</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Ask me anything - create tasks, analyze data, write code, or just chat.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6" ref={messagesEndRef}>
                    {currentSessionMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex space-x-3",
                          msg.role === "user" ? "flex-row-reverse" : "flex-row"
                        )}
                      >
                        <Avatar className={cn("h-8 w-8 flex-shrink-0", msg.role === "user" ? "ml-2" : "mr-2")}>
                          <AvatarImage src={msg.role === "user" ? user?.avatar : undefined} alt="" />
                          <AvatarFallback>
                            {msg.role === "user"
                              ? user?.name?.charAt(0).toUpperCase()
                              : "\ud83e\udd16"}
                          </AvatarFallback>
                        </Avatar>

                        <div className={cn(
                          "max-w-[70%] space-y-1",
                          msg.role === "user" ? "text-right" : "text-left"
                        )}>
                          <div className={cn(
                            "px-4 py-2 rounded-2xl",
                            msg.role === "user"
                              ? "bg-primary text-white rounded-tr-none"
                              : "bg-white border border-gray-200 rounded-tl-none"
                          )}>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-400">
                            <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Bot className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome to Chat</h2>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      Select a conversation from the sidebar or start a new chat to begin.
                    </p>
                    <Button onClick={handleNewChat} size="lg">
                      <Bot className="mr-2 h-4 w-4" />
                      New Chat
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
            {/* Input Area */}
            <div className="border-t border-gray-200 bg-white p-4 lg:p-6">
              <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
                <div className="flex items-end space-x-3">
                  <Button type="button" variant="ghost" size="icon" className="h-10 w-10">
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <div className="flex-1 relative">
                    <textarea
                      ref={textareaRef}
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        adjustTextareaHeight();
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder="Message..."
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      rows={1}
                      style={{ minHeight: "44px", maxHeight: "200px" }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 bottom-2 h-8 w-8"
                    >
                      <Mic className="h-5 w-5" />
                    </Button>
                  </div>
                  <Button
                    type="submit"
                    disabled={!message.trim() || !currentSession}
                    className="h-10 w-10 rounded-full bg-primary text-white hover:bg-primary-700 disabled:opacity-50"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </form>
            </div>
        </main>
      </div>
    </div>
  );
}