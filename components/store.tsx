"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { Profile } from "@/lib/data";
import { announceSessionChange, fetchSession } from "@/lib/auth/client";
import { AUTH_SESSION_KEY } from "@/lib/auth/session";
type State = {
  profile: Profile | null;
};
const empty: State = { profile: null };
const Context = createContext<{
  state: State;
  ready: boolean;
  update: (fn: (s: State) => State) => void;
} | null>(null);
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(empty);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    let request: AbortController | null = null;
    async function syncSession() {
      request?.abort();
      const current = new AbortController();
      request = current;
      try {
        const profile = await fetchSession(current.signal);
        if (active && !current.signal.aborted)
          setState((state) => ({ ...state, profile }));
      } catch {
        if (active && !current.signal.aborted)
          setState((state) => ({ ...state, profile: null }));
      } finally {
        if (active && !current.signal.aborted) setReady(true);
      }
    }
    void syncSession();
    function onStorage(event: StorageEvent) {
      if (
        (event.key === AUTH_SESSION_KEY || event.key === null) &&
        event.storageArea === window.localStorage
      )
        announceSessionChange();
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener("shiny-auth-session-change", syncSession);
    window.addEventListener("focus", syncSession);
    return () => {
      active = false;
      request?.abort();
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("shiny-auth-session-change", syncSession);
      window.removeEventListener("focus", syncSession);
    };
  }, []);
  return (
    <Context.Provider value={{ state, ready, update: setState }}>
      {children}
    </Context.Provider>
  );
}
export function useStore() {
  const store = useContext(Context);
  if (!store) throw new Error("StoreProvider is required");
  return store;
}
