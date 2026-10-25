"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { ApiError } from "@/lib/api/client";
import {
  addCartItem,
  clearRemoteCart,
  fetchCart,
  removeCartItem,
  setCartQuantity,
  type AddCartInput,
  type CartSnapshot,
} from "@/lib/api/cart";
import { readAuthSession } from "@/lib/auth/session";
import { authErrorMessage } from "@/lib/auth/contracts";
import { useStore } from "@/components/store";

type Status = "idle" | "loading" | "ready" | "error";
type CartContext = {
  cart: CartSnapshot | null;
  status: Status;
  busy: boolean;
  error: string;
  reload: () => Promise<void>;
  add: (input: AddCartInput) => Promise<void>;
  setQuantity: (id: number, quantity: number) => Promise<void>;
  remove: (id: number) => Promise<void>;
  clear: () => Promise<void>;
};
const Context = createContext<CartContext | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { ready } = useStore();
  const [token, setToken] = useState<string | null>(null);
  const [cart, setCart] = useState<CartSnapshot | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => {
    if (!ready) return;
    const sync = () => setToken(readAuthSession()?.token ?? null);
    sync();
    window.addEventListener("shiny-auth-session-change", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("shiny-auth-session-change", sync);
      window.removeEventListener("focus", sync);
    };
  }, [ready]);

  const reload = useCallback(async () => {
    if (!token || readAuthSession()?.token !== token) return;
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setStatus("loading");
    setError("");
    try {
      const snapshot = await fetchCart(controller.signal);
      if (!controller.signal.aborted && readAuthSession()?.token === token) {
        setCart(snapshot);
        setStatus("ready");
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setError(authErrorMessage(error));
        setStatus("error");
      }
    } finally {
      if (request.current === controller) request.current = null;
    }
  }, [token]);

  useEffect(() => {
    setCart(null);
    setStatus("idle");
    setError("");
    setBusy(false);
    void reload();
    return () => {
      request.current?.abort();
      request.current = null;
    };
  }, [reload]);

  async function mutate(action: (signal: AbortSignal) => Promise<void>) {
    if (!token || readAuthSession()?.token !== token) throw new ApiError(401);
    if (request.current || status !== "ready")
      throw new ApiError(409, { message: "انتظر تحديث السلة ثم حاول مرة أخرى." });
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError("");
    try {
      await action(controller.signal);
      controller.signal.throwIfAborted();
      setStatus("loading");
      try {
        const snapshot = await fetchCart(controller.signal);
        controller.signal.throwIfAborted();
        if (readAuthSession()?.token === token) {
          setCart(snapshot);
          setStatus("ready");
        }
      } catch (error) {
        controller.signal.throwIfAborted();
        setStatus("error");
        setError(
          "تم تنفيذ العملية، لكن تعذر تحديث عرض السلة. اضغط إعادة المحاولة لتحديثها.",
        );
      }
    } catch (error) {
      if (!controller.signal.aborted) setError(authErrorMessage(error));
      throw error;
    } finally {
      if (request.current === controller) {
        request.current = null;
        setBusy(false);
      }
    }
  }

  return (
    <Context.Provider
      value={{
        cart: token && readAuthSession()?.token === token ? cart : null,
        status,
        busy,
        error,
        reload,
        add: (input) => mutate((signal) => addCartItem(input, signal)),
        setQuantity: (id, quantity) =>
          mutate((signal) => setCartQuantity(id, quantity, signal)),
        remove: (id) => mutate((signal) => removeCartItem(id, signal)),
        clear: () => mutate((signal) => clearRemoteCart(signal)),
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useCart() {
  const cart = useContext(Context);
  if (!cart) throw new Error("CartProvider is required");
  return cart;
}
