"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

// Auth users/sessions are served by better-auth at /api/auth (mounted in
// vite.config.ts dev middleware backed by @company-in-a-box/core).
interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

interface Session {
  accessToken: string;
  expiresAt: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithProvider: (provider: "apple" | "google") => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function mapSessionData(data: { user: any; session: any } | null): { user: User; session: Session } | null {
  if (!data?.user || !data?.session) return null;
  return {
    user: { id: data.user.id, email: data.user.email, name: data.user.name, avatar: data.user.image },
    session: { accessToken: data.session.token, expiresAt: new Date(data.session.expiresAt).getTime() },
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      const mapped = mapSessionData(data);
      if (mapped) {
        setUser(mapped.user);
        setSession(mapped.session);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await authClient.signIn.email({ email, password });
    if (error) throw new Error(error.message || "Login failed");
    // The body returns {user, token}; the canonical session lives in the
    // httpOnly cookie — fetch it rather than trusting the response shape.
    const { data } = await authClient.getSession();
    const mapped = mapSessionData(data as any);
    if (!mapped) throw new Error("Login failed");
    setUser(mapped.user);
    setSession(mapped.session);
  };

  const register = async (email: string, password: string, name: string) => {
    const { error } = await authClient.signUp.email({ email, password, name });
    if (error) throw new Error(error.message || "Registration failed");
    const { data } = await authClient.getSession();
    const mapped = mapSessionData(data as any);
    if (!mapped) throw new Error("Registration failed");
    setUser(mapped.user);
    setSession(mapped.session);
  };

  const loginWithProvider = async (provider: "apple" | "google") => {
    const { data, error } = await authClient.signIn.social({ provider, callbackURL: "/dashboard" });
    if (error) throw new Error(error.message || "Sign-in failed");
    // Real OAuth: the provider URL exchange completes after the round trip;
    // navigate to the provider (better-auth completes the callback).
    if (data?.url) window.location.href = data.url;
  };

  const logout = async () => {
    await authClient.signOut();
    setUser(null);
    setSession(null);
  };

  const refreshSession = async () => {
    const { data } = await authClient.getSession();
    const mapped = mapSessionData(data as any);
    if (mapped) {
      setUser(mapped.user);
      setSession(mapped.session);
    } else {
      setUser(null);
      setSession(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, login, register, loginWithProvider, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
