import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    username: varchar("username", { length: 50 }).notNull().unique(),
    displayName: varchar("display_name", { length: 100 }),
    avatarUrl: text("avatar_url"),
    phone: varchar("phone", { length: 20 }),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
    stripeConnectAccountId: varchar("stripe_connect_account_id", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    emailIdx: index("idx_users_email").on(table.email),
    usernameIdx: index("idx_users_username").on(table.username)
  })
);

export const charities = pgTable("charities", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  websiteUrl: text("website_url"),
  stripeAccountId: varchar("stripe_account_id", { length: 255 }),
  isAntiCharity: boolean("is_anti_charity").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const friendships = pgTable(
  "friendships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requesterId: uuid("requester_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    addresseeId: uuid("addressee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 20 }).default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    requesterIdx: index("idx_friendships_requester").on(table.requesterId),
    addresseeIdx: index("idx_friendships_addressee").on(table.addresseeId),
    statusIdx: index("idx_friendships_status").on(table.status),
    uniquePair: uniqueIndex("friendships_requester_addressee_unique").on(
      table.requesterId,
      table.addresseeId
    )
  })
);

export const commitments = pgTable(
  "commitments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    refereeId: uuid("referee_id").references(() => users.id, { onDelete: "set null" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 50 }).notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    checkInFrequency: varchar("check_in_frequency", { length: 20 }).notNull(),
    stakesAmount: integer("stakes_amount").default(0).notNull(),
    stakesCurrency: varchar("stakes_currency", { length: 3 }).default("USD").notNull(),
    stakesDestination: varchar("stakes_destination", { length: 50 }),
    charityId: uuid("charity_id").references(() => charities.id),
    stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
    stakesStatus: varchar("stakes_status", { length: 20 }).default("pending").notNull(),
    status: varchar("status", { length: 20 }).default("pending_referee").notNull(),
    refereeAcceptedAt: timestamp("referee_accepted_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    result: varchar("result", { length: 20 }),
    totalCheckInsRequired: integer("total_check_ins_required").notNull(),
    successfulCheckIns: integer("successful_check_ins").default(0).notNull(),
    failedCheckIns: integer("failed_check_ins").default(0).notNull(),
    isPublic: boolean("is_public").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    userIdx: index("idx_commitments_user").on(table.userId),
    refereeIdx: index("idx_commitments_referee").on(table.refereeId),
    statusIdx: index("idx_commitments_status").on(table.status),
    categoryIdx: index("idx_commitments_category").on(table.category),
    publicIdx: index("idx_commitments_public")
      .on(table.isPublic)
      .where(sql`${table.isPublic} = true`)
  })
);

export const checkIns = pgTable(
  "check_ins",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    commitmentId: uuid("commitment_id")
      .notNull()
      .references(() => commitments.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    checkInDate: date("check_in_date").notNull(),
    note: text("note"),
    proofPhotoUrl: text("proof_photo_url"),
    userReportedStatus: varchar("user_reported_status", { length: 20 }).notNull(),
    refereeVerified: boolean("referee_verified").default(false).notNull(),
    refereeStatus: varchar("referee_status", { length: 20 }),
    refereeNote: text("referee_note"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    finalStatus: varchar("final_status", { length: 20 }).default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    commitmentIdx: index("idx_check_ins_commitment").on(table.commitmentId),
    userIdx: index("idx_check_ins_user").on(table.userId),
    dateIdx: index("idx_check_ins_date").on(table.checkInDate),
    pendingIdx: index("idx_check_ins_pending")
      .on(table.refereeStatus)
      .where(sql`${table.refereeStatus} = 'pending'`),
    uniqueCommitmentDate: uniqueIndex("check_ins_commitment_date_unique").on(
      table.commitmentId,
      table.checkInDate
    )
  })
);

export const challenges = pgTable(
  "challenges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    challengerId: uuid("challenger_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    challengedId: uuid("challenged_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 50 }).notNull(),
    metric: varchar("metric", { length: 100 }).notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    stakesAmount: integer("stakes_amount").notNull(),
    stakesCurrency: varchar("stakes_currency", { length: 3 }).default("USD").notNull(),
    challengerPaymentIntentId: varchar("challenger_payment_intent_id", { length: 255 }),
    challengedPaymentIntentId: varchar("challenged_payment_intent_id", { length: 255 }),
    challengerPaid: boolean("challenger_paid").default(false).notNull(),
    challengedPaid: boolean("challenged_paid").default(false).notNull(),
    status: varchar("status", { length: 20 }).default("pending").notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    challengerScore: integer("challenger_score").default(0).notNull(),
    challengedScore: integer("challenged_score").default(0).notNull(),
    winnerId: uuid("winner_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    challengerIdx: index("idx_challenges_challenger").on(table.challengerId),
    challengedIdx: index("idx_challenges_challenged").on(table.challengedId),
    statusIdx: index("idx_challenges_status").on(table.status)
  })
);

export const challengeCheckIns = pgTable(
  "challenge_check_ins",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    challengeId: uuid("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    checkInDate: date("check_in_date").notNull(),
    value: integer("value").notNull(),
    note: text("note"),
    proofPhotoUrl: text("proof_photo_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    challengeIdx: index("idx_challenge_check_ins_challenge").on(table.challengeId),
    userIdx: index("idx_challenge_check_ins_user").on(table.userId),
    uniqueUserDate: uniqueIndex("challenge_check_ins_unique").on(
      table.challengeId,
      table.userId,
      table.checkInDate
    )
  })
);

export const activities = pgTable(
  "activities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    activityType: varchar("activity_type", { length: 50 }).notNull(),
    referenceType: varchar("reference_type", { length: 50 }),
    referenceId: uuid("reference_id"),
    metadata: jsonb("metadata"),
    isPublic: boolean("is_public").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    userIdx: index("idx_activities_user").on(table.userId),
    typeIdx: index("idx_activities_type").on(table.activityType),
    createdIdx: index("idx_activities_created").on(table.createdAt),
    publicIdx: index("idx_activities_public")
      .on(table.isPublic, table.createdAt)
      .where(sql`${table.isPublic} = true`)
  })
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    notificationType: varchar("notification_type", { length: 50 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body").notNull(),
    referenceType: varchar("reference_type", { length: 50 }),
    referenceId: uuid("reference_id"),
    isRead: boolean("is_read").default(false).notNull(),
    isPushed: boolean("is_pushed").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    userIdx: index("idx_notifications_user").on(table.userId),
    unreadIdx: index("idx_notifications_unread")
      .on(table.userId, table.isRead)
      .where(sql`${table.isRead} = false`)
  })
);

export const userStats = pgTable("user_stats", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  totalCommitments: integer("total_commitments").default(0).notNull(),
  commitmentsWon: integer("commitments_won").default(0).notNull(),
  commitmentsLost: integer("commitments_lost").default(0).notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  totalStakesAmount: integer("total_stakes_amount").default(0).notNull(),
  totalWonAmount: integer("total_won_amount").default(0).notNull(),
  totalLostAmount: integer("total_lost_amount").default(0).notNull(),
  totalChallenges: integer("total_challenges").default(0).notNull(),
  challengesWon: integer("challenges_won").default(0).notNull(),
  challengesLost: integer("challenges_lost").default(0).notNull(),
  categoryStats: jsonb("category_stats").default(sql`'{}'::jsonb`).notNull(),
  timesBeenReferee: integer("times_been_referee").default(0).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const pushTokens = pgTable(
  "push_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 255 }).notNull(),
    platform: varchar("platform", { length: 20 }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    userIdx: index("idx_push_tokens_user").on(table.userId),
    uniqueUserToken: uniqueIndex("push_tokens_user_token_unique").on(
      table.userId,
      table.token
    )
  })
);
