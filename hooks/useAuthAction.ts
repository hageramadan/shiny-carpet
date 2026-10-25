"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { authErrorMessage } from "@/lib/auth/contracts";

export function useAuthAction() {
  const active = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  useEffect(() => () => active.current?.abort(), []);
  const run = useCallback(
    async (action: string, task: (signal: AbortSignal) => Promise<void>) => {
      if (active.current) return;
      const controller = new AbortController();
      active.current = controller;
      setBusy(action);
      setError("");
      try {
        await task(controller.signal);
      } catch (error) {
        if (!controller.signal.aborted) setError(authErrorMessage(error));
      } finally {
        if (!controller.signal.aborted) setBusy(null);
        if (active.current === controller) active.current = null;
      }
    },
    [],
  );
  return { busy, pending: busy !== null, error, setError, run };
}
