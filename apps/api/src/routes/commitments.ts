import { Hono } from "hono";

export const commitmentRoutes = new Hono();

commitmentRoutes.get("/", (c) => c.json({ items: [] }));
commitmentRoutes.get("/:id", (c) => {
  const id = c.req.param("id");
  return c.json({ id });
});
commitmentRoutes.post("/", (c) => c.json({ message: "create commitment" }));
commitmentRoutes.patch("/:id", (c) => c.json({ message: "update commitment" }));
commitmentRoutes.delete("/:id", (c) => c.json({ message: "cancel commitment" }));

commitmentRoutes.post("/:id/accept-referee", (c) =>
  c.json({ message: "referee accepted" })
);
commitmentRoutes.post("/:id/decline-referee", (c) =>
  c.json({ message: "referee declined" })
);
