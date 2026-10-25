"use client";
import { useCallback, useEffect, useState } from "react";

type Resource<T> = {
  key: string;
  attempt: number;
  status: "loading" | "success" | "error";
  data: T | null;
  error: Error | null;
};

export function useApiResource<T>(
  key: string | null,
  load: (signal: AbortSignal) => Promise<T>,
) {
  const [attempt, setAttempt] = useState(0);
  const [resource, setResource] = useState<Resource<T> | null>(null);
  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    if (key === null) return;
    const controller = new AbortController();
    let active = true;
    setResource({ key, attempt, status: "loading", data: null, error: null });
    Promise.resolve()
      .then(() => load(controller.signal))
      .then(
        (data) => {
          if (active) setResource({ key, attempt, status: "success", data, error: null });
        },
        (error: unknown) => {
          if (active)
            setResource({
              key,
              attempt,
              status: "error",
              data: null,
              error: error instanceof Error ? error : new Error("API request failed"),
            });
        },
      );
    return () => {
      active = false;
      controller.abort();
    };
  }, [key, load, attempt]);

  const current = resource?.key === key && resource.attempt === attempt ? resource : null;
  return {
    status: key === null ? ("idle" as const) : (current?.status ?? ("loading" as const)),
    data: current?.data ?? null,
    error: current?.error ?? null,
    reload,
  };
}
