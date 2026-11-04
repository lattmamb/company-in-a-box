import { createHash } from "crypto";
import { getDatabase } from "../db/client";
import { financePackets, financePacketVersions, type FinancePacket, type FinancePacketVersion } from "../db/schema";
import { and, desc, eq } from "drizzle-orm";
import { ulid } from "ulid";

export interface CreatePacketInput {
  companyId: string;
  title: string;
  kind: FinancePacket["kind"];
  createdBy: string;
}

export async function createPacket(input: CreatePacketInput): Promise<FinancePacket> {
  const db = getDatabase();
  const packet = { id: ulid(), ...input };
  await db.insert(financePackets).values(packet);
  return (await db.select().from(financePackets).where(eq(financePackets.id, packet.id)).limit(1))[0];
}

export async function listPackets(companyId: string): Promise<FinancePacket[]> {
  const db = getDatabase();
  return db
    .select()
    .from(financePackets)
    .where(eq(financePackets.companyId, companyId))
    .orderBy(desc(financePackets.createdAt));
}

export async function getPacket(packetId: string): Promise<FinancePacket | null> {
  const db = getDatabase();
  const rows = await db.select().from(financePackets).where(eq(financePackets.id, packetId)).limit(1);
  return rows[0] ?? null;
}

export interface CommitVersionInput {
  packetId: string;
  body: Record<string, unknown>;
  changeSummary?: string;
  createdBy: string;
}

/**
 * Commit a new immutable packet version. Content-addressed (sha256 of body);
 * if the body is unchanged from the latest version, returns that version
 * instead of creating a duplicate.
 */
export async function commitPacketVersion(input: CommitVersionInput): Promise<FinancePacketVersion> {
  const db = getDatabase();
  const latest = await db
    .select()
    .from(financePacketVersions)
    .where(eq(financePacketVersions.packetId, input.packetId))
    .orderBy(desc(financePacketVersions.version))
    .limit(1);

  const sha256 = createHash("sha256").update(JSON.stringify(input.body)).digest("hex");
  if (latest[0]?.sha256 === sha256) return latest[0];

  const version = {
    id: ulid(),
    packetId: input.packetId,
    version: (latest[0]?.version ?? 0) + 1,
    sha256,
    parentSha256: latest[0]?.sha256 ?? null,
    body: input.body,
    changeSummary: input.changeSummary,
    createdBy: input.createdBy,
    createdAt: new Date(),
  };
  await db.insert(financePacketVersions).values(version);
  return version;
}

export async function listPacketVersions(packetId: string): Promise<FinancePacketVersion[]> {
  const db = getDatabase();
  return db
    .select()
    .from(financePacketVersions)
    .where(eq(financePacketVersions.packetId, packetId))
    .orderBy(financePacketVersions.version);
}

export async function setPacketStatus(packetId: string, status: FinancePacket["status"]): Promise<FinancePacket | null> {
  const db = getDatabase();
  const updated = await db
    .update(financePackets)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(financePackets.id, packetId)))
    .returning();
  return updated[0] ?? null;
}
