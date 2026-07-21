import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";

export interface CommitUpdateMessage {
  teamId: number;
  teamRepositoryId?: number | null;
  eventId?: number | null;
  commitSha?: string | null;
  commitMessage?: string | null;
  committedAt?: string | null;
  commitCount?: number | null;
}

export type CommitConnectionStatus = "disconnected" | "connecting" | "connected";

function resolveCommitWebSocketUrl() {
  const configured = import.meta.env.VITE_WS_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "") + "/ws/commits";
  }
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws/commits`;
}

export function useCommitUpdates(options?: {
  teamId?: number | null;
  eventId?: number | null;
  enabled?: boolean;
}) {
  const queryClient = useQueryClient();
  const teamId = options?.teamId ?? null;
  const eventId = options?.eventId ?? null;
  const enabled = options?.enabled ?? true;
  const [connectionStatus, setConnectionStatus] = useState<CommitConnectionStatus>("disconnected");
  const queryClientRef = useRef(queryClient);

  useEffect(() => {
    queryClientRef.current = queryClient;
  }, [queryClient]);

  useEffect(() => {
    if (!enabled) {
      setConnectionStatus("disconnected");
      return;
    }

    let socket: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let closedByUser = false;

    function invalidateForMessage(message: CommitUpdateMessage) {
      void queryClientRef.current.invalidateQueries({ queryKey: queryKeys.submission.all });
      void queryClientRef.current.invalidateQueries({ queryKey: queryKeys.repositories.all });
      void queryClientRef.current.invalidateQueries({ queryKey: ["judge", "repositories"] });
      if (message.teamRepositoryId != null) {
        void queryClientRef.current.invalidateQueries({
          queryKey: ["team-repositories", message.teamRepositoryId]
        });
      }
    }

    function connect() {
      setConnectionStatus("connecting");
      socket = new WebSocket(resolveCommitWebSocketUrl());
      socket.onopen = () => setConnectionStatus("connected");
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(String(event.data)) as CommitUpdateMessage;
          if (teamId != null && message.teamId !== teamId) return;
          if (eventId != null && message.eventId != null && message.eventId !== eventId) return;
          invalidateForMessage(message);
        } catch {
          // ignore malformed payloads
        }
      };
      socket.onerror = () => setConnectionStatus("disconnected");
      socket.onclose = () => {
        setConnectionStatus("disconnected");
        if (!closedByUser) {
          reconnectTimer = window.setTimeout(connect, 5000);
        }
      };
    }

    connect();

    return () => {
      closedByUser = true;
      if (reconnectTimer != null) {
        window.clearTimeout(reconnectTimer);
      }
      socket?.close();
      setConnectionStatus("disconnected");
    };
  }, [enabled, eventId, teamId]);

  return { connectionStatus };
}
