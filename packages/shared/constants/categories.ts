export const categories = [
  "fitness",
  "productivity",
  "health",
  "learning",
  "finance",
  "other"
] as const;

export type Category = (typeof categories)[number];
