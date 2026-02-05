import { Hono } from "hono";
import type { AppEnv } from "../types/hono";
import { requireAuth } from "../middleware/requireAuth";
import { createCheckInSchema, createCommitmentSchema } from "../utils/validation";
import {
  createCommitment,
  getCommitmentDashboard,
  getCommitmentById,
  listCommitments
} from "../services/commitment.service";
import { createCheckInForCommitment, listCheckInsForCommitment } from "../services/checkin.service";

export const commitmentRoutes = new Hono<AppEnv>();

commitmentRoutes.get("/", requireAuth, async (c) => {
  const authUser = c.get("user");
  if (!authUser) return c.json({ error: "Unauthorized" }, 401);
  const items = await listCommitments(authUser.id);
  return c.json({ items });
});

commitmentRoutes.get("/dashboard", requireAuth, async (c) => {
  const authUser = c.get("user");
  if (!authUser) return c.json({ error: "Unauthorized" }, 401);
  const summary = await getCommitmentDashboard(authUser.id);
  return c.json(summary);
});

commitmentRoutes.get("/:id", requireAuth, async (c) => {
  const authUser = c.get("user");
  if (!authUser) return c.json({ error: "Unauthorized" }, 401);
  const id = c.req.param("id");
  const item = await getCommitmentById(id, authUser.id);
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json({ item });
});

commitmentRoutes.post("/", requireAuth, async (c) => {
  const authUser = c.get("user");
  if (!authUser) return c.json({ error: "Unauthorized" }, 401);
  const payload = await c.req.json().catch(() => ({}));
  const parsed = createCommitmentSchema.safeParse(payload);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  try {
    const item = await createCommitment(authUser.id, parsed.data);
    return c.json({ item }, 201);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

commitmentRoutes.get("/:id/check-ins", requireAuth, async (c) => {
  const authUser = c.get("user");
  if (!authUser) return c.json({ error: "Unauthorized" }, 401);
  const id = c.req.param("id");
  try {
    const items = await listCheckInsForCommitment(authUser.id, id);
    return c.json({ items });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 404);
  }
});

commitmentRoutes.post("/:id/check-ins", requireAuth, async (c) => {
  const authUser = c.get("user");
  if (!authUser) return c.json({ error: "Unauthorized" }, 401);
  const id = c.req.param("id");
  const payload = await c.req.json().catch(() => ({}));
  const parsed = createCheckInSchema.safeParse(payload);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }
  try {
    const item = await createCheckInForCommitment(authUser.id, id, parsed.data);
    return c.json({ item }, 201);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

commitmentRoutes.patch("/:id", (c) => c.json({ message: "update commitment" }));
commitmentRoutes.delete("/:id", (c) => c.json({ message: "cancel commitment" }));

commitmentRoutes.post("/:id/accept-referee", (c) =>
  c.json({ message: "referee accepted" })
);
commitmentRoutes.post("/:id/decline-referee", (c) =>
  c.json({ message: "referee declined" })
);
