import { useEffect, useState } from "react";
import { apiBase } from "@/lib/api";

export type RealtimeState = "connecting" | "live" | "offline";

export function useRealtime({
  enabled,
  projectId,
  publicKey,
  onEvent,
}: {
  enabled: boolean;
  projectId: string;
  publicKey: string;
  onEvent: () => void;
}) {
  const [state, setState] = useState<RealtimeState>("offline");

  useEffect(() => {
    if (!enabled || !projectId || !publicKey || typeof WebSocket === "undefined") {
      setState("offline");
      return;
    }

    let closed = false;
    let socket: WebSocket | undefined;
    let retryTimer: number | undefined;
    let retryDelay = 1000;

    const connect = () => {
      if (closed) return;
      setState("connecting");
      const protocol = location.protocol === "https:" ? "wss:" : "ws:";
      socket = new WebSocket(
        `${protocol}//${location.host}${apiBase}/projects/${encodeURIComponent(projectId)}/events?projectKey=${encodeURIComponent(publicKey)}`,
      );
      socket.addEventListener("open", () => {
        retryDelay = 1000;
        setState("live");
      });
      socket.addEventListener("message", (event) => {
        try {
          const message = JSON.parse(String(event.data)) as { type?: string };
          if (message.type && message.type !== "connected") onEvent();
        } catch {
          // Ignore malformed stream messages; the next event or reconnect will recover.
        }
      });
      socket.addEventListener("close", () => {
        if (closed) return;
        setState("offline");
        retryTimer = window.setTimeout(connect, retryDelay);
        retryDelay = Math.min(retryDelay * 2, 10000);
      });
      socket.addEventListener("error", () => setState("offline"));
    };

    connect();
    return () => {
      closed = true;
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
      socket?.close();
    };
    // onEvent is intentionally excluded: it is recreated on every render and
    // would tear down the socket on each state update.
  }, [enabled, projectId, publicKey]);

  return state;
}
