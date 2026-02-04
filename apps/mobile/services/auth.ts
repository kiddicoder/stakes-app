import { supabase } from "./supabase";

function getEmailRedirectTo() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/verify`;
  }
  return "accountability://verify";
}

export function formatAuthError(message: string) {
  if (message.toLowerCase().includes("rate limit")) {
    return "Too many email requests. Please wait a bit, then try again.";
  }
  return message;
}

export async function sendMagicLink(email: string) {
  return supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: getEmailRedirectTo()
    }
  });
}

export async function sendSignupMagicLink(
  email: string,
  username: string,
  displayName?: string
) {
  return supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: getEmailRedirectTo(),
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
