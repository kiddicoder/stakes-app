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
