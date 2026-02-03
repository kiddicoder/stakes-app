import { useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { getSession, onAuthStateChange } from "../services/auth";

export function useAuth() {
  const { setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    let active = true;

    getSession().then(({ data }) => {
      if (!active) return;
      const session = data.session;
      if (session?.user?.id && session.access_token) {
        setAuth(session.user.id, session.access_token);
      } else {
        clearAuth();
      }
    });

    const { data } = onAuthStateChange((_event, session) => {
      if (session?.user?.id && session.access_token) {
        setAuth(session.user.id, session.access_token);
      } else {
        clearAuth();
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [setAuth, clearAuth]);

  return useAuthStore();
}
