import { useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { getSession, onAuthStateChange } from "../services/auth";
import { syncProfile } from "../services/profile";

export function useAuth() {
  const { setAuth, clearAuth, setInitialized } = useAuthStore();

  useEffect(() => {
    let active = true;

    getSession().then(({ data }) => {
      if (!active) return;
      const session = data.session;
      if (session?.user?.id && session.access_token) {
        setAuth(session.user.id, session.access_token);
        syncProfile().catch(() => undefined);
      } else {
        clearAuth();
      }
      setInitialized(true);
    });

    const { data } = onAuthStateChange(async (_event, session) => {
      if (session?.user?.id && session.access_token) {
        setAuth(session.user.id, session.access_token);
        await syncProfile().catch(() => undefined);
      } else {
        clearAuth();
      }
      setInitialized(true);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [setAuth, clearAuth, setInitialized]);

  return useAuthStore();
}
