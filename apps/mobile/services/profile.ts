import { apiFetch } from "./api";

export type ProfileResponse = {
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
  isNew?: boolean;
};

export async function syncProfile() {
  return apiFetch<ProfileResponse>("/auth/me");
}
