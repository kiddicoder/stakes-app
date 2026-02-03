import { create } from "zustand";

export type AuthState = {
  userId: string | null;
  accessToken: string | null;
  initialized: boolean;
  setAuth: (userId: string, accessToken: string) => void;
  clearAuth: () => void;
  setInitialized: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  accessToken: null,
  initialized: false,
  setAuth: (userId, accessToken) => set({ userId, accessToken }),
  clearAuth: () => set({ userId: null, accessToken: null }),
  setInitialized: (value) => set({ initialized: value })
}));
