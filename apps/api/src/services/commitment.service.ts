import { and, eq, or } from "drizzle-orm";
import { db } from "../db";
import { commitments } from "../db/schema";
import { calculateCheckInsRequired } from "../utils/dates";

export async function listCommitments(userId: string) {
  return db
    .select()
    .from(commitments)
    .where(or(eq(commitments.userId, userId), eq(commitments.refereeId, userId)));
}

export async function getCommitmentById(id: string, userId: string) {
  const rows = await db
    .select()
    .from(commitments)
    .where(
      and(
        eq(commitments.id, id),
        or(eq(commitments.userId, userId), eq(commitments.refereeId, userId))
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function createCommitment(
  userId: string,
  payload: {
    title: string;
    description?: string;
    category: string;
    startDate: string;
    endDate: string;
    checkInFrequency: "daily" | "weekly" | "one_time";
    stakesAmount: number;
    stakesCurrency: string;
    stakesDestination?: string;
    refereeId?: string;
    charityId?: string;
    isPublic?: boolean;
  }
) {
  const totalCheckInsRequired = calculateCheckInsRequired(
    payload.startDate,
    payload.endDate,
    payload.checkInFrequency
  );

  const hasStakes = payload.stakesAmount > 0;
  if (hasStakes && !payload.refereeId) {
    throw new Error("refereeId is required when stakesAmount > 0");
  }

  const status = hasStakes && payload.refereeId ? "pending_referee" : "active";

  const rows = await db
    .insert(commitments)
    .values({
      userId,
      refereeId: payload.refereeId,
      title: payload.title,
      description: payload.description,
      category: payload.category,
      startDate: payload.startDate,
      endDate: payload.endDate,
      checkInFrequency: payload.checkInFrequency,
      stakesAmount: payload.stakesAmount,
      stakesCurrency: payload.stakesCurrency,
      stakesDestination: payload.stakesDestination,
      charityId: payload.charityId,
      status,
      totalCheckInsRequired,
      isPublic: payload.isPublic ?? false
    })
    .returning();

  return rows[0];
}
