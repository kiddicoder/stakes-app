import { apiFetch } from "./api";

export type SearchUser = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export async function searchUsers(query: string) {
  const encoded = encodeURIComponent(query.trim());
  return apiFetch<{ query: string; results: SearchUser[] }>(`/users/search?q=${encoded}`);
}
