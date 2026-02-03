import type { Category } from "../constants/categories";

export type User = {
  id: string;
  email: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
};

export type Commitment = {
  id: string;
  userId: string;
  refereeId?: string | null;
  title: string;
  description?: string | null;
  category: Category;
  startDate: string;
  endDate: string;
  checkInFrequency: "daily" | "weekly" | "one_time";
  stakesAmount: number;
  stakesCurrency: "USD" | string;
  status: "pending_referee" | "active" | "completed" | "failed" | "cancelled";
};

export type Challenge = {
  id: string;
  challengerId: string;
  challengedId: string;
  title: string;
  description?: string | null;
  category: Category;
  metric: string;
  startDate: string;
  endDate: string;
  stakesAmount: number;
  status: "pending" | "accepted" | "active" | "completed" | "cancelled";
};
