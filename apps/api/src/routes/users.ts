import { Hono } from "hono";
import type { AppEnv } from "../types/hono";
import { updateUserSchema } from "../utils/validation";
import {
  ensureUserProfile,
  getUserById,
  getUserStatsById,
  searchUsers,
  updateUserById
} from "../services/user.service";
import { requireAuth } from "../middleware/requireAuth";

export const userRoutes = new Hono<AppEnv>();

userRoutes.get("/search", (c) => {
  const query = c.req.query("q") ?? "";
  return searchUsers(query).then((results) => c.json({ query, results }));
});

userRoutes.get("/me", requireAuth, async (c) => {
  const authUser = c.get("user");
  if (!authUser) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const { user } = await ensureUserProfile(authUser);
  return c.json({ user });
});

userRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const user = await getUserById(id);
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }
  return c.json({ user });
});

userRoutes.get("/:id/stats", async (c) => {
  const id = c.req.param("id");
  const stats = await getUserStatsById(id);
  return c.json({ id, stats });
});

userRoutes.patch("/me", requireAuth, async (c) => {
  const authUser = c.get("user");

  const payload = await c.req.json().catch(() => ({}));
  const parsed = updateUserSchema.safeParse(payload);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  if (Object.keys(parsed.data).length === 0) {
    return c.json({ error: "No fields provided" }, 400);
  }

  try {
    const user = await updateUserById(authUser.id, parsed.data);
    return c.json({ user });
  } catch (error) {
    return c.json({ error: "Unable to update user" }, 400);
  }
});

userRoutes.post("/me/avatar", requireAuth, async (c) => {
  const authUser = c.get("user");

  const payload = await c.req.json().catch(() => ({}));
  const parsed = updateUserSchema.pick({ avatarUrl: true }).safeParse(payload);
  if (!parsed.success || !parsed.data.avatarUrl) {
    return c.json({ error: "avatarUrl is required" }, 400);
  }

  const user = await updateUserById(authUser.id, { avatarUrl: parsed.data.avatarUrl });
  return c.json({ user });
});

userRoutes.delete("/me", (c) => c.json({ message: "delete account" }));
