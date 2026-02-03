import { z } from "zod";

export const usernameSchema = z
  .string()
  .min(3)
  .max(50)
  .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores are allowed");

export const updateUserSchema = z
  .object({
    username: usernameSchema.optional(),
    displayName: z.string().max(100).optional(),
    avatarUrl: z.string().url().optional(),
    phone: z.string().max(20).optional()
  })
  .strict();

export const createCommitmentSchema = z
  .object({
    title: z.string().min(1).max(255),
    description: z.string().max(2000).optional(),
    category: z.string().max(50),
    startDate: z.string().min(10),
    endDate: z.string().min(10),
    checkInFrequency: z.enum(["daily", "weekly", "one_time"]),
    stakesAmount: z.number().int().min(0).default(0),
    stakesCurrency: z.string().max(3).default("USD"),
    stakesDestination: z.string().max(50).optional(),
    refereeId: z.string().uuid().optional(),
    charityId: z.string().uuid().optional(),
    isPublic: z.boolean().optional()
  })
  .strict();
