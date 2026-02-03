import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { authRoutes } from "./routes/auth";
import { userRoutes } from "./routes/users";
import { commitmentRoutes } from "./routes/commitments";

const app = new Hono();

app.get("/health", (c) => c.json({ ok: true }));

app.route("/auth", authRoutes);
app.route("/users", userRoutes);
app.route("/commitments", commitmentRoutes);

const port = Number(process.env.PORT ?? 3000);

serve({ fetch: app.fetch, port });

console.log(`API running on http://localhost:${port}`);
