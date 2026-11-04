import { getDatabase } from "../db/client";
import { companies, members, type Company, type NewCompany, type Member, type NewMember, type CompanySettings } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { ulid } from "ulid";

export interface CreateCompanyInput {
  name: string;
  slug: string;
  description?: string;
  settings?: Partial<CompanySettings>;
  ownerId: string;
  ownerEmail: string;
  ownerName?: string;
}

export interface UpdateCompanyInput {
  name?: string;
  description?: string;
  settings?: Partial<CompanySettings>;
}

export interface InviteMemberInput {
  email: string;
  name?: string;
  role?: "admin" | "member" | "viewer";
}

export async function createCompany(input: CreateCompanyInput) {
  const db = getDatabase();

  const defaultSettings: CompanySettings = {
    requireBoardApprovalForNewAgents: true,
    defaultAgentBudgetCents: 0,
    defaultCurrency: "USD",
    timezone: "UTC",
    features: {
      evidenceVault: true,
      financePackets: true,
      fleetManagement: true,
      skillEvolution: true,
    },
    ...input.settings,
  };

  const company: NewCompany = {
    id: ulid(),
    name: input.name,
    slug: input.slug,
    description: input.description,
    settings: defaultSettings,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await db.insert(companies).values(company);

  // Add owner as member
  const member: NewMember = {
    id: ulid(),
    companyId: company.id,
    userId: input.ownerId,
    email: input.ownerEmail,
    name: input.ownerName,
    role: "owner",
    status: "active",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await db.insert(members).values(member);

  return { company, member };
}

export async function getCompany(companyId: string) {
  const db = getDatabase();
  const result = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
  return result[0] || null;
}

export async function getCompanyBySlug(slug: string) {
  const db = getDatabase();
  const result = await db.select().from(companies).where(eq(companies.slug, slug)).limit(1);
  return result[0] || null;
}

export async function updateCompany(companyId: string, input: UpdateCompanyInput) {
  const db = getDatabase();

  const current = await getCompany(companyId);
  if (!current) throw new Error("Company not found");

  const updatedSettings: CompanySettings = {
    ...current.settings,
    ...input.settings,
  };

  await db
    .update(companies)
    .set({
      name: input.name ?? current.name,
      description: input.description ?? current.description,
      settings: updatedSettings,
      updatedAt: Date.now(),
    })
    .where(eq(companies.id, companyId));

  return getCompany(companyId);
}

export async function listCompanies() {
  const db = getDatabase();
  return db.select().from(companies).orderBy(desc(companies.createdAt));
}

export async function getCompanyMembers(companyId: string) {
  const db = getDatabase();
  return db.select().from(members).where(eq(members.companyId, companyId)).orderBy(desc(members.createdAt));
}

export async function inviteMember(companyId: string, input: InviteMemberInput) {
  const db = getDatabase();

  const existing = await db
    .select()
    .from(members)
    .where(and(eq(members.companyId, companyId), eq(members.email, input.email)))
    .limit(1);

  if (existing[0]) {
    throw new Error("Member already exists");
  }

  const member: NewMember = {
    id: ulid(),
    companyId,
    userId: ulid(), // Will be updated when user accepts
    email: input.email,
    name: input.name,
    role: input.role || "member",
    status: "invited",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await db.insert(members).values(member);
  return member;
}

export async function updateMemberRole(companyId: string, memberId: string, role: "admin" | "member" | "viewer") {
  const db = getDatabase();

  await db
    .update(members)
    .set({ role, updatedAt: Date.now() })
    .where(and(eq(members.id, memberId), eq(members.companyId, companyId)));

  return db.select().from(members).where(eq(members.id, memberId)).limit(1);
}

export async function removeMember(companyId: string, memberId: string) {
  const db = getDatabase();

  await db
    .delete(members)
    .where(and(eq(members.id, memberId), eq(members.companyId, companyId)));

  return { success: true };
}

export async function acceptInvitation(companyId: string, email: string, userId: string, name?: string) {
  const db = getDatabase();

  const member = await db
    .select()
    .from(members)
    .where(and(eq(members.companyId, companyId), eq(members.email, email), eq(members.status, "invited")))
    .limit(1);

  if (!member[0]) {
    throw new Error("No pending invitation found");
  }

  await db
    .update(members)
    .set({
      userId,
      name: name ?? member[0].name,
      status: "active",
      updatedAt: Date.now(),
    })
    .where(eq(members.id, member[0].id));

  return db.select().from(members).where(eq(members.id, member[0].id)).limit(1);
}