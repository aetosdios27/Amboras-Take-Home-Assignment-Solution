"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:3001";
const SOCKET_NS = "/analytics";

export function useSocket(storeId: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!storeId) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = io(`${SOCKET_URL}${SOCKET_NS}`, {
      transports: ["websocket"],
      autoConnect: true,
      auth: { token },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join-store", { storeId });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    // If the server rejects our token, clean up gracefully
    socket.on("auth:error", (payload: { message: string }) => {
      console.warn("[socket] auth rejected:", payload.message);
      socket.disconnect();
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [storeId]);

  return { socketRef, isConnected };
}
