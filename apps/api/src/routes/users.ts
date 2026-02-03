import { Hono } from "hono";

export const userRoutes = new Hono();

userRoutes.get("/search", (c) => {
  const query = c.req.query("q") ?? "";
  return c.json({ query, results: [] });
});

userRoutes.get("/:id", (c) => {
  const id = c.req.param("id");
  return c.json({ id });
});

userRoutes.get("/:id/stats", (c) => {
  const id = c.req.param("id");
  return c.json({ id, stats: null });
});

userRoutes.patch("/me", (c) => c.json({ message: "update profile" }));
userRoutes.post("/me/avatar", (c) => c.json({ message: "upload avatar" }));
userRoutes.delete("/me", (c) => c.json({ message: "delete account" }));
