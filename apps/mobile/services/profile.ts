import { apiFetch } from "./api";

export type Profile = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type ProfileResponse = {
  user: Profile | null;
  isNew?: boolean;
};

export async function syncProfile() {
  return apiFetch<ProfileResponse>("/auth/me");
}

export async function getMe() {
  return apiFetch<{ user: Profile }>("/users/me");
}

export async function updateMe(payload: {
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  phone?: string;
}) {
  return apiFetch<{ user: Profile | null }>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}
