import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";
import type { AppEnv } from "../types/hono";

export const authRoutes = new Hono<AppEnv>();

authRoutes.post("/register", (c) => c.json({ message: "register" }));
authRoutes.post("/login", (c) => c.json({ message: "login" }));
authRoutes.post("/magic-link", (c) => c.json({ message: "magic-link" }));
authRoutes.post("/verify", (c) => c.json({ message: "verify" }));
authRoutes.post("/refresh", (c) => c.json({ message: "refresh" }));
authRoutes.post("/logout", (c) => c.json({ message: "logout" }));

authRoutes.use("/me", authMiddleware);
authRoutes.get("/me", (c) => c.json({ user: c.get("user") ?? null }));
