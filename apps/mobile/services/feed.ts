import { apiFetch } from "./api";

export type FeedItem = {
  id: string;
  activityType: string;
  referenceType: string | null;
  referenceId: string | null;
  metadata: Record<string, unknown> | null;
  isPublic: boolean;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
};

export async function getFriendsFeed() {
  return apiFetch<{ items: FeedItem[] }>("/feed");
}

export async function getPublicFeed() {
  return apiFetch<{ items: FeedItem[] }>("/feed/public");
}
