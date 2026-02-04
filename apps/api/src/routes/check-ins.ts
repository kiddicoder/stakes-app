import { Hono } from "hono";
import type { AppEnv } from "../types/hono";
import { requireAuth } from "../middleware/requireAuth";
import { refereeActionSchema } from "../utils/validation";
import {
  disputeCheckIn,
  listPendingCheckIns,
  verifyCheckIn
} from "../services/checkin.service";

export const checkInRoutes = new Hono<AppEnv>();

checkInRoutes.get("/pending-verification", requireAuth, async (c) => {
  const authUser = c.get("user");
  if (!authUser) return c.json({ error: "Unauthorized" }, 401);
  const items = await listPendingCheckIns(authUser.id);
  return c.json({ items });
});

checkInRoutes.post("/:id/verify", requireAuth, async (c) => {
  const authUser = c.get("user");
  if (!authUser) return c.json({ error: "Unauthorized" }, 401);
  const payload = await c.req.json().catch(() => ({}));
  const parsed = refereeActionSchema.safeParse(payload);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }
  try {
    const item = await verifyCheckIn(authUser.id, c.req.param("id"), parsed.data.refereeNote);
    return c.json({ item });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

checkInRoutes.post("/:id/dispute", requireAuth, async (c) => {
  const authUser = c.get("user");
  if (!authUser) return c.json({ error: "Unauthorized" }, 401);
  const payload = await c.req.json().catch(() => ({}));
  const parsed = refereeActionSchema.safeParse(payload);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }
  try {
    const item = await disputeCheckIn(authUser.id, c.req.param("id"), parsed.data.refereeNote);
    return c.json({ item });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});
