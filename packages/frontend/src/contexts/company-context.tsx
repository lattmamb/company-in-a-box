"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Company, Member } from "@company-in-a-box/core";

interface CompanyContextType {
  company: Company | null;
  members: Member[];
  loading: boolean;
  currentCompanyId: string | null;
  setCurrentCompany: (companyId: string) => void;
  createCompany: (name: string, slug: string) => Promise<void>;
  inviteMember: (email: string, role: string) => Promise<void>;
  refreshCompany: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | null>(null);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);

  useEffect(() => {
    // Load from localStorage or API
    const stored = localStorage.getItem("cib_current_company");
    if (stored) {
      setCurrentCompanyId(stored);
      // Fetch company data
    }
    setLoading(false);
  }, []);

  const setCurrentCompany = (companyId: string) => {
    setCurrentCompanyId(companyId);
    localStorage.setItem("cib_current_company", companyId);
    // Fetch company data
  };

  const createCompany = async (name: string, slug: string) => {
    // Call API
    // shortcut: mock row omits server columns until the company API exists.
    const newCompany = { id: "new", name, slug } as Company;
    setCompany(newCompany);
    setCurrentCompany(newCompany.id);
  };

  const inviteMember = async (email: string, role: string) => {
    // Call API
  };

  const refreshCompany = async () => {
    // Fetch latest company data
  };

  return (
    <CompanyContext.Provider value={{ company, members, loading, currentCompanyId, setCurrentCompany, createCompany, inviteMember, refreshCompany }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) throw new Error("useCompany must be used within CompanyProvider");
  return context;
}