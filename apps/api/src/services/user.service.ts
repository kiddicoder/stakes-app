import { randomBytes } from "crypto";
import type { User as SupabaseUser } from "@supabase/supabase-js";
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

async function isUsernameAvailable(username: string) {
  const rows = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
  return rows.length === 0;
}

function normalizeUsernameBase(value: string) {
  const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
  return cleaned.slice(0, 30) || "user";
}

async function generateUniqueUsername(base: string) {
  const normalized = normalizeUsernameBase(base);
  if (await isUsernameAvailable(normalized)) return normalized;

  for (let i = 0; i < 5; i += 1) {
    const suffix = randomBytes(2).toString("hex");
    const candidate = `${normalized}_${suffix}`.slice(0, 50);
    if (await isUsernameAvailable(candidate)) return candidate;
  }

  const fallback = `user_${randomBytes(3).toString("hex")}`.slice(0, 50);
  if (await isUsernameAvailable(fallback)) return fallback;

  return `${normalized}_${Date.now()}`.slice(0, 50);
}

export async function ensureUserProfile(authUser: SupabaseUser) {
  const existing = await getUserById(authUser.id);
  if (existing) {
    return { user: existing, isNew: false };
  }

  const email = authUser.email ?? "";
  const emailBase = email.split("@")[0] || "user";
  const base =
    typeof authUser.user_metadata?.username === "string"
      ? authUser.user_metadata.username
      : authUser.user_metadata?.full_name || emailBase;

  const username = await generateUniqueUsername(base);
  const displayName =
    typeof authUser.user_metadata?.full_name === "string"
      ? authUser.user_metadata.full_name
      : typeof authUser.user_metadata?.name === "string"
        ? authUser.user_metadata.name
        : null;
  const avatarUrl =
    typeof authUser.user_metadata?.avatar_url === "string"
      ? authUser.user_metadata.avatar_url
      : null;

  const result = await db.transaction(async (tx) => {
    const created = await tx
      .insert(users)
      .values({
        id: authUser.id,
        email,
        username,
        displayName,
        avatarUrl,
        updatedAt: new Date()
      })
      .returning(publicUserFields);

    await tx
      .insert(userStats)
      .values({ userId: authUser.id })
      .onConflictDoNothing();

    return created[0] ?? null;
  });

  return { user: result, isNew: true };
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
