"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/components/store";
import { readAuthSession } from "@/lib/auth/session";
import { authErrorMessage } from "@/lib/auth/contracts";
export function useOrdersApi<T>(
  load: (signal: AbortSignal) => Promise<T>,
  enabled = true,
) {
  const { state, ready } = useStore();
  const token = ready && state.profile ? readAuthSession()?.token : undefined;
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    load: typeof load;
    token: string;
    data?: T;
    error?: string;
  } | null>(null);
  useEffect(() => {
    setResult(null);
    if (!token || !enabled) return;
    const controller = new AbortController();
    void load(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted && readAuthSession()?.token === token)
          setResult({ load, token, data });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setResult({ load, token, error: authErrorMessage(error) });
      });
    return () => controller.abort();
  }, [load, token, enabled, revision]);
  const current = result?.load === load && result?.token === token ? result : null;
  return {
    data: current?.data,
    error: current?.error,
    loading: !ready || (!!token && enabled && !current),
    signedIn: !!token,
    reload: () => setRevision((value) => value + 1),
  };
}
