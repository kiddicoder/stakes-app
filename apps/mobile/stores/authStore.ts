import { create } from "zustand";

export type AuthState = {
  userId: string | null;
  accessToken: string | null;
  setAuth: (userId: string, accessToken: string) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  accessToken: null,
  setAuth: (userId, accessToken) => set({ userId, accessToken }),
  clearAuth: () => set({ userId: null, accessToken: null })
}));
