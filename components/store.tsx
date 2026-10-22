"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { Address, CartItem, Order, Profile } from "@/lib/data";
type State = {
  cart: CartItem[];
  profile: Profile | null;
  addresses: Address[];
  orders: Order[];
};
const empty: State = { cart: [], profile: null, addresses: [], orders: [] };
const Context = createContext<{
  state: State;
  ready: boolean;
  update: (fn: (s: State) => State) => void;
} | null>(null);
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(empty);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("shiny-carpet-demo-v1");
      if (raw) setState({ ...empty, ...JSON.parse(raw) });
    } catch {
      /* An unavailable store starts a fresh demo. */
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem("shiny-carpet-demo-v1", JSON.stringify(state));
      } catch {
        /* The interface also works without persistence. */
      }
    }
  }, [state, ready]);
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
