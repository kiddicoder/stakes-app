import { and, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "../db";
import { activities, checkIns, commitments, userStats, users } from "../db/schema";
import { calculateCheckInsRequired, parseDate } from "../utils/dates";

const DAY_MS = 24 * 60 * 60 * 1000;

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfWeekMonday(date: Date) {
  const day = date.getUTCDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  const start = new Date(date);
  start.setUTCDate(date.getUTCDate() - diffToMonday);
  return start;
}

function getDaysRemaining(endDate: string, today: Date) {
  const end = parseDate(endDate);
  const diff = Math.floor((end.getTime() - today.getTime()) / DAY_MS);
  return Math.max(0, diff);
}

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

  const created = rows[0];
  if (created) {
    await db.insert(activities).values({
      userId,
      activityType: "commitment_created",
      referenceType: "commitment",
      referenceId: created.id,
      metadata: {
        title: created.title,
        stakesAmount: created.stakesAmount
      },
      isPublic: created.isPublic
    });
  }

  return created;
}

export async function getCommitmentDashboard(userId: string) {
  const [profileRow] = await db
    .select({
      username: users.username,
      displayName: users.displayName
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const [statsRow] = await db
    .select({
      currentStreak: userStats.currentStreak,
      longestStreak: userStats.longestStreak,
      commitmentsWon: userStats.commitmentsWon,
      commitmentsLost: userStats.commitmentsLost
    })
    .from(userStats)
    .where(eq(userStats.userId, userId))
    .limit(1);

  const activeCommitments = await db
    .select()
    .from(commitments)
    .where(and(eq(commitments.userId, userId), eq(commitments.status, "active")))
    .orderBy(commitments.endDate);

  const commitmentIds = activeCommitments.map((item) => item.id);
  const relatedCheckIns =
    commitmentIds.length > 0
      ? await db
          .select({
            commitmentId: checkIns.commitmentId,
            checkInDate: checkIns.checkInDate
          })
          .from(checkIns)
          .where(inArray(checkIns.commitmentId, commitmentIds))
      : [];

  const pendingVerificationCountRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(checkIns)
    .innerJoin(commitments, eq(checkIns.commitmentId, commitments.id))
    .where(and(eq(commitments.refereeId, userId), eq(checkIns.refereeStatus, "pending")));

  const today = parseDate(toISODate(new Date()));
  const todayString = toISODate(today);
  const monday = toISODate(startOfWeekMonday(today));
  const isSunday = today.getUTCDay() === 0;

  const checkInsByCommitment = new Map<string, string[]>();
  for (const item of relatedCheckIns) {
    const existing = checkInsByCommitment.get(item.commitmentId) ?? [];
    existing.push(item.checkInDate);
    checkInsByCommitment.set(item.commitmentId, existing);
  }

  const decoratedCommitments = activeCommitments.map((item) => {
    const checkInDates = checkInsByCommitment.get(item.id) ?? [];
    const isWithinRange = todayString >= item.startDate && todayString <= item.endDate;
    const hasTodayCheckIn = checkInDates.includes(todayString);
    const hasWeekCheckIn = checkInDates.some(
      (date) => date >= monday && date <= todayString
    );

    let checkInDueToday = false;
    if (isWithinRange) {
      if (item.checkInFrequency === "daily") {
        checkInDueToday = !hasTodayCheckIn;
      } else if (item.checkInFrequency === "weekly") {
        checkInDueToday = isSunday && !hasWeekCheckIn;
      } else if (item.checkInFrequency === "one_time") {
        checkInDueToday = todayString === item.endDate && !hasTodayCheckIn;
      }
    }

    const completedCount = item.successfulCheckIns + item.failedCheckIns;
    const progressPercent =
      item.totalCheckInsRequired > 0
        ? Math.min(100, Math.round((completedCount / item.totalCheckInsRequired) * 100))
        : 0;

    return {
      ...item,
      checkInDueToday,
      completedCount,
      progressPercent,
      daysRemaining: getDaysRemaining(item.endDate, today)
    };
  });

  return {
    profile: {
      username: profileRow?.username ?? null,
      displayName: profileRow?.displayName ?? null
    },
    stats: {
      currentStreak: statsRow?.currentStreak ?? 0,
      longestStreak: statsRow?.longestStreak ?? 0,
      commitmentsWon: statsRow?.commitmentsWon ?? 0,
      commitmentsLost: statsRow?.commitmentsLost ?? 0
    },
    activeCommitments: decoratedCommitments,
    pendingActions: {
      checkInsDueToday: decoratedCommitments.filter((item) => item.checkInDueToday).length,
      refereeVerificationsNeeded: Number(pendingVerificationCountRows[0]?.count ?? 0),
      challengeInvites: 0
    }
  };
}
