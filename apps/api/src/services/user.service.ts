import { eq, ilike, or } from "drizzle-orm";
import { db } from "../db";
import { userStats, users } from "../db/schema";

export type PublicUser = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

const publicUserFields = {
  id: users.id,
  username: users.username,
  displayName: users.displayName,
  avatarUrl: users.avatarUrl
};

export async function getUserById(id: string) {
  const rows = await db.select(publicUserFields).from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function searchUsers(query: string) {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const like = `%${trimmed}%`;
  return db
    .select(publicUserFields)
    .from(users)
    .where(or(ilike(users.username, like), ilike(users.displayName, like)))
    .limit(20);
}

export async function updateUserById(
  id: string,
  updates: Partial<{
    username: string;
    displayName: string;
    avatarUrl: string;
    phone: string;
  }>
) {
  const values: Partial<typeof users.$inferInsert> = {
    updatedAt: new Date()
  };

  if (updates.username !== undefined) values.username = updates.username;
  if (updates.displayName !== undefined) values.displayName = updates.displayName;
  if (updates.avatarUrl !== undefined) values.avatarUrl = updates.avatarUrl;
  if (updates.phone !== undefined) values.phone = updates.phone;

  const rows = await db
    .update(users)
    .set(values)
    .where(eq(users.id, id))
    .returning(publicUserFields);

  return rows[0] ?? null;
}

export async function getUserStatsById(id: string) {
  const rows = await db.select().from(userStats).where(eq(userStats.userId, id)).limit(1);
  return rows[0] ?? null;
}
