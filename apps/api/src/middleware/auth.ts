import type { MiddlewareHandler } from "hono";

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  // TODO: verify JWT from Supabase or custom auth
  await next();
};
