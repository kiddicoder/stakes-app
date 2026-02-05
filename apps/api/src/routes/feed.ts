import { Hono } from "hono";
import type { AppEnv } from "../types/hono";
import { requireAuth } from "../middleware/requireAuth";
import { listFeed, listPublicFeed } from "../services/feed.service";

export const feedRoutes = new Hono<AppEnv>();

feedRoutes.get("/", requireAuth, async (c) => {
  const authUser = c.get("user");
  if (!authUser) return c.json({ error: "Unauthorized" }, 401);
  const items = await listFeed(authUser.id);
  return c.json({ items });
});

feedRoutes.get("/public", requireAuth, async (c) => {
  const items = await listPublicFeed();
  return c.json({ items });
});
