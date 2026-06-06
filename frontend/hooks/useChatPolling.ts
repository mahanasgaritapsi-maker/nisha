"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseChatPollingOptions<T> = {
  fetchFn: () => Promise<T>;
  intervalMs?: number;
  enabled?: boolean;
};

export function useChatPolling<T>({
  fetchFn,
  intervalMs = 4000,
  enabled = true,
}: UseChatPollingOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const refetch = useCallback(async () => {
    try {
      const result = await fetchFnRef.current();
      setData(result);
      setError(null);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void refetch();

    const tick = () => {
      if (document.visibilityState === "hidden") return;
      void refetch();
    };

    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs, refetch]);

  return { data, error, isLoading, refetch, setData };
}
