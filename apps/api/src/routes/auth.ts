import { Hono } from "hono";

export const authRoutes = new Hono();

authRoutes.post("/register", (c) => c.json({ message: "register" }));
authRoutes.post("/login", (c) => c.json({ message: "login" }));
authRoutes.post("/magic-link", (c) => c.json({ message: "magic-link" }));
authRoutes.post("/verify", (c) => c.json({ message: "verify" }));
authRoutes.post("/refresh", (c) => c.json({ message: "refresh" }));
authRoutes.post("/logout", (c) => c.json({ message: "logout" }));
authRoutes.get("/me", (c) => c.json({ user: null }));
