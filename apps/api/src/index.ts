import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { authRoutes } from "./routes/auth";
import { userRoutes } from "./routes/users";
import { commitmentRoutes } from "./routes/commitments";
import { checkInRoutes } from "./routes/check-ins";
import { feedRoutes } from "./routes/feed";
import { authMiddleware } from "./middleware/auth";
import type { AppEnv } from "./types/hono";

const app = new Hono<AppEnv>();

app.get("/health", (c) => c.json({ ok: true }));

app.route("/auth", authRoutes);
app.use("/users/*", authMiddleware);
app.route("/users", userRoutes);
app.use("/commitments/*", authMiddleware);
app.route("/commitments", commitmentRoutes);
app.use("/check-ins/*", authMiddleware);
app.route("/check-ins", checkInRoutes);
app.use("/feed/*", authMiddleware);
app.route("/feed", feedRoutes);

const port = Number(process.env.PORT ?? 3000);

serve({ fetch: app.fetch, port });

console.log(`API running on http://localhost:${port}`);
