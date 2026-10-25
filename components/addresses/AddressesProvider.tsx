"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useStore } from "@/components/store";
import { ApiError } from "@/lib/api/client";
import {
  fetchAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  type AddressDraft,
} from "@/lib/api/addresses";
import { readAuthSession } from "@/lib/auth/session";
import { authErrorMessage } from "@/lib/auth/contracts";
import type { Address } from "@/lib/data";

type State = {
  loaded: boolean;
  addresses: Address[];
  status: "idle" | "loading" | "ready" | "error";
  busy: boolean;
  error: string;
  reload: () => Promise<void>;
  create: (draft: AddressDraft) => Promise<Address>;
  edit: (id: string, draft: AddressDraft) => Promise<Address>;
  remove: (id: string) => Promise<void>;
};
const Context = createContext<State | null>(null);
export function AddressesProvider({ children }: { children: React.ReactNode }) {
  const { ready } = useStore();
  const [token, setToken] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [status, setStatus] = useState<State["status"]>("idle");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
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
    if (!token || readAuthSession()?.token !== token || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setStatus("loading");
    setError("");
    try {
      const next = await fetchAddresses(controller.signal);
      if (!controller.signal.aborted && readAuthSession()?.token === token) {
        setAddresses(next);
        setLoaded(true);
        setStatus("ready");
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setStatus("error");
        setError(authErrorMessage(error));
      }
    } finally {
      if (request.current === controller) request.current = null;
    }
  }, [token]);
  useEffect(() => {
    setAddresses([]);
    setLoaded(false);
    setStatus("idle");
    setError("");
    setBusy(false);
    void reload();
    return () => {
      request.current?.abort();
      request.current = null;
    };
  }, [reload]);

  async function mutate<T>(task: (signal: AbortSignal) => Promise<T>): Promise<T> {
    if (!token || readAuthSession()?.token !== token) throw new ApiError(401);
    if (request.current || status !== "ready")
      throw new ApiError(409, { message: "انتظر تحميل العناوين ثم حاول مرة أخرى." });
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError("");
    try {
      const result = await task(controller.signal);
      controller.signal.throwIfAborted();
      setStatus("loading");
      try {
        const next = await fetchAddresses(controller.signal);
        controller.signal.throwIfAborted();
        if (readAuthSession()?.token === token) {
          setAddresses(next);
          setLoaded(true);
          setStatus("ready");
        }
      } catch {
        controller.signal.throwIfAborted();
        setStatus("error");
        setError("تم تنفيذ العملية، لكن تعذر تحديث عرض العناوين. أعد تحميل العناوين.");
      }
      return result;
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
        loaded: Boolean(token && readAuthSession()?.token === token && loaded),
        addresses: token && readAuthSession()?.token === token ? addresses : [],
        status,
        busy,
        error,
        reload,
        create: (draft) => mutate((signal) => createAddress(draft, signal)),
        edit: (id, draft) => mutate((signal) => updateAddress(id, draft, signal)),
        remove: (id) => mutate((signal) => deleteAddress(id, signal)),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useAddresses() {
  const value = useContext(Context);
  if (!value) throw new Error("AddressesProvider is required");
  return value;
}
