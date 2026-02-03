import { supabase } from "./supabase";

export async function sendMagicLink(email: string) {
  return supabase.auth.signInWithOtp({ email });
}

export async function sendSignupMagicLink(
  email: string,
  username: string,
  displayName?: string
) {
  return supabase.auth.signInWithOtp({
    email,
    options: {
      data: {
        username,
        full_name: displayName || undefined
      }
    }
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getSession() {
  return supabase.auth.getSession();
}

export function onAuthStateChange(
  callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]
) {
  return supabase.auth.onAuthStateChange(callback);
}
