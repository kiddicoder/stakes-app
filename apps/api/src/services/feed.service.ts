import { and, desc, eq, or } from "drizzle-orm";
import { db } from "../db";
import { activities, users } from "../db/schema";

const baseSelection = {
  id: activities.id,
  activityType: activities.activityType,
  referenceType: activities.referenceType,
  referenceId: activities.referenceId,
  metadata: activities.metadata,
  isPublic: activities.isPublic,
  createdAt: activities.createdAt,
  user: {
    id: users.id,
    username: users.username,
    displayName: users.displayName,
    avatarUrl: users.avatarUrl
  }
};

export async function listFeed(userId: string, limit = 50) {
  return db
    .select(baseSelection)
    .from(activities)
    .innerJoin(users, eq(activities.userId, users.id))
    .where(or(eq(activities.userId, userId), eq(activities.isPublic, true)))
    .orderBy(desc(activities.createdAt))
    .limit(limit);
}

export async function listPublicFeed(limit = 50) {
  return db
    .select(baseSelection)
    .from(activities)
    .innerJoin(users, eq(activities.userId, users.id))
    .where(and(eq(activities.isPublic, true)))
    .orderBy(desc(activities.createdAt))
    .limit(limit);
}
