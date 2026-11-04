import { getDatabase } from "../db/client";
import { goals, type Goal } from "../db/schema";
import { desc, eq } from "drizzle-orm";
import { ulid } from "ulid";

export interface CreateGoalInput {
  companyId: string;
  title: string;
  description?: string;
  createdBy: string;
}

export async function listGoals(companyId: string): Promise<Goal[]> {
  const db = getDatabase();
  return db
    .select()
    .from(goals)
    .where(eq(goals.companyId, companyId))
    .orderBy(desc(goals.createdAt));
}

export async function createGoal(input: CreateGoalInput): Promise<Goal> {
  const db = getDatabase();
  const goal = {
    id: ulid(),
    companyId: input.companyId,
    title: input.title,
    description: input.description,
    createdBy: input.createdBy,
  };
  await db.insert(goals).values(goal);
  return (await db.select().from(goals).where(eq(goals.id, goal.id)).limit(1))[0];
}

export async function updateGoal(goalId: string, input: { title?: string; description?: string; status?: Goal["status"] }): Promise<Goal | null> {
  const db = getDatabase();
  const patch: Partial<typeof goals.$inferInsert> = { updatedAt: new Date() };
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.status !== undefined) patch.status = input.status;
  const updated = await db.update(goals).set(patch).where(eq(goals.id, goalId)).returning();
  return updated[0] ?? null;
}
