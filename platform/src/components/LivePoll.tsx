"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Stand-in for the real-time WebSocket gateway described in the
 * architecture spec (Phase 1 still owes that). Until then, a soft
 * background refresh keeps chat/board views close to live without the
 * infrastructure lift of a socket server.
 */
export function LivePoll({ intervalMs = 4000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
