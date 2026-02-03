import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";
import { ensureUserProfile } from "../services/user.service";
import type { AppEnv } from "../types/hono";

export const authRoutes = new Hono<AppEnv>();

authRoutes.post("/register", (c) => c.json({ message: "register" }));
authRoutes.post("/login", (c) => c.json({ message: "login" }));
authRoutes.post("/magic-link", (c) => c.json({ message: "magic-link" }));
authRoutes.post("/verify", (c) => c.json({ message: "verify" }));
authRoutes.post("/refresh", (c) => c.json({ message: "refresh" }));
authRoutes.post("/logout", (c) => c.json({ message: "logout" }));

authRoutes.use("/me", authMiddleware);
authRoutes.get("/me", async (c) => {
  const authUser = c.get("user");
  if (!authUser) {
    return c.json({ user: null }, 401);
  }
  const { user, isNew } = await ensureUserProfile(authUser);
  return c.json({ user, isNew });
});
