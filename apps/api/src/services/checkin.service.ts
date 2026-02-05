import { and, eq, or, sql } from "drizzle-orm";
import { db } from "../db";
import { activities, checkIns, commitments } from "../db/schema";
import { parseDate } from "../utils/dates";

export async function listCheckInsForCommitment(userId: string, commitmentId: string) {
  const commitment = await db
    .select()
    .from(commitments)
    .where(
      and(
        eq(commitments.id, commitmentId),
        or(eq(commitments.userId, userId), eq(commitments.refereeId, userId))
      )
    )
    .limit(1);

  if (!commitment[0]) {
    throw new Error("Commitment not found");
  }

  return db
    .select()
    .from(checkIns)
    .where(eq(checkIns.commitmentId, commitmentId))
    .orderBy(checkIns.checkInDate);
}

export async function createCheckInForCommitment(
  userId: string,
  commitmentId: string,
  payload: {
    checkInDate: string;
    note?: string;
    proofPhotoUrl?: string;
    userReportedStatus: "success" | "failure";
  }
) {
  const rows = await db
    .select()
    .from(commitments)
    .where(and(eq(commitments.id, commitmentId), eq(commitments.userId, userId)))
    .limit(1);

  const commitment = rows[0];
  if (!commitment) {
    throw new Error("Commitment not found");
  }

  const start = parseDate(commitment.startDate);
  const end = parseDate(commitment.endDate);
  const checkInDate = parseDate(payload.checkInDate);

  if (checkInDate.getTime() < start.getTime() || checkInDate.getTime() > end.getTime()) {
    throw new Error("checkInDate must be within commitment range");
  }

  const requiresReferee = commitment.stakesAmount > 0;
  const refereeStatus = requiresReferee ? "pending" : "verified";
  const refereeVerified = !requiresReferee;
  const finalStatus = requiresReferee ? "pending" : payload.userReportedStatus;

  const result = await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(checkIns)
      .values({
        commitmentId,
        userId,
        checkInDate: payload.checkInDate,
        note: payload.note,
        proofPhotoUrl: payload.proofPhotoUrl,
        userReportedStatus: payload.userReportedStatus,
        refereeVerified,
        refereeStatus,
        finalStatus
      })
      .returning();

    if (finalStatus === "success") {
      await tx
        .update(commitments)
        .set({
          successfulCheckIns: sql`${commitments.successfulCheckIns} + 1`
        })
        .where(eq(commitments.id, commitmentId));
    }

    if (finalStatus === "failure") {
      await tx
        .update(commitments)
        .set({
          failedCheckIns: sql`${commitments.failedCheckIns} + 1`
        })
        .where(eq(commitments.id, commitmentId));
    }

    if (finalStatus !== "pending") {
      await tx.insert(activities).values({
        userId: commitment.userId,
        activityType: finalStatus === "success" ? "check_in_success" : "check_in_failure",
        referenceType: "check_in",
        referenceId: inserted[0]?.id,
        metadata: {
          commitmentId,
          checkInDate: payload.checkInDate,
          title: commitment.title
        },
        isPublic: commitment.isPublic
      });
    }

    return inserted[0];
  });

  return result;
}

export async function listPendingCheckIns(refereeId: string) {
  return db
    .select({
      checkIn: checkIns,
      commitment: commitments
    })
    .from(checkIns)
    .innerJoin(commitments, eq(checkIns.commitmentId, commitments.id))
    .where(and(eq(commitments.refereeId, refereeId), eq(checkIns.refereeStatus, "pending")))
    .orderBy(checkIns.createdAt);
}

export async function verifyCheckIn(
  refereeId: string,
  checkInId: string,
  refereeNote?: string
) {
  const rows = await db
    .select({ checkIn: checkIns, commitment: commitments })
    .from(checkIns)
    .innerJoin(commitments, eq(checkIns.commitmentId, commitments.id))
    .where(eq(checkIns.id, checkInId))
    .limit(1);

  const record = rows[0];
  if (!record) {
    throw new Error("Check-in not found");
  }

  if (record.commitment.refereeId !== refereeId) {
    throw new Error("Not authorized");
  }

  if (record.checkIn.finalStatus !== "pending") {
    throw new Error("Check-in already resolved");
  }

  const finalStatus = record.checkIn.userReportedStatus;

  const updated = await db.transaction(async (tx) => {
    const updatedRows = await tx
      .update(checkIns)
      .set({
        refereeStatus: "verified",
        refereeVerified: true,
        refereeNote: refereeNote ?? null,
        verifiedAt: new Date(),
        finalStatus
      })
      .where(eq(checkIns.id, checkInId))
      .returning();

    if (finalStatus === "success") {
      await tx
        .update(commitments)
        .set({
          successfulCheckIns: sql`${commitments.successfulCheckIns} + 1`
        })
        .where(eq(commitments.id, record.commitment.id));
    } else {
      await tx
        .update(commitments)
        .set({
          failedCheckIns: sql`${commitments.failedCheckIns} + 1`
        })
        .where(eq(commitments.id, record.commitment.id));
    }

    await tx.insert(activities).values({
      userId: record.commitment.userId,
      activityType: finalStatus === "success" ? "check_in_success" : "check_in_failure",
      referenceType: "check_in",
      referenceId: record.checkIn.id,
      metadata: {
        commitmentId: record.commitment.id,
        checkInDate: record.checkIn.checkInDate,
        title: record.commitment.title
      },
      isPublic: record.commitment.isPublic
    });

    return updatedRows[0];
  });

  return updated;
}

export async function disputeCheckIn(
  refereeId: string,
  checkInId: string,
  refereeNote?: string
) {
  const rows = await db
    .select({ checkIn: checkIns, commitment: commitments })
    .from(checkIns)
    .innerJoin(commitments, eq(checkIns.commitmentId, commitments.id))
    .where(eq(checkIns.id, checkInId))
    .limit(1);

  const record = rows[0];
  if (!record) {
    throw new Error("Check-in not found");
  }

  if (record.commitment.refereeId !== refereeId) {
    throw new Error("Not authorized");
  }

  if (record.checkIn.finalStatus !== "pending") {
    throw new Error("Check-in already resolved");
  }

  const updated = await db.transaction(async (tx) => {
    const updatedRows = await tx
      .update(checkIns)
      .set({
        refereeStatus: "disputed",
        refereeVerified: true,
        refereeNote: refereeNote ?? null,
        verifiedAt: new Date(),
        finalStatus: "failure"
      })
      .where(eq(checkIns.id, checkInId))
      .returning();

    await tx
      .update(commitments)
      .set({
        failedCheckIns: sql`${commitments.failedCheckIns} + 1`
      })
      .where(eq(commitments.id, record.commitment.id));

    await tx.insert(activities).values({
      userId: record.commitment.userId,
      activityType: "check_in_failure",
      referenceType: "check_in",
      referenceId: record.checkIn.id,
      metadata: {
        commitmentId: record.commitment.id,
        checkInDate: record.checkIn.checkInDate,
        title: record.commitment.title
      },
      isPublic: record.commitment.isPublic
    });

    return updatedRows[0];
  });

  return updated;
}
