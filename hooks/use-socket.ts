"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

let socket: Socket | null = null;

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    if (!socket) {
      socket = io(SOCKET_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      socket.on("connect", () => {
        console.log("Socket connected");
        setIsConnected(true);
      });

      socket.on("disconnect", () => {
        console.log("Socket disconnected");
        setIsConnected(false);
      });

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setIsConnected(false);
      });
    }

    return () => {
      // Don't disconnect on component unmount - keep persistent connection
    };
  }, []);

  return { socket, isConnected };
}

// Hook specifically for log streaming
export function useLogStream() {
  const { socket, isConnected } = useSocket();
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!socket || !isConnected) {
      console.log("useLogStream: waiting for socket connection...", { socket: !!socket, isConnected });
      return;
    }

    console.log("useLogStream: joining logs room");
    // Join logs room
    socket.emit("join-logs");

    // Listen for new logs
    const handleNewLog = (log: any) => {
      console.log("useLogStream: received new log", log);
      setLogs((prev) => {
        // Add new log at the beginning
        const updated = [log, ...prev];
        // Keep only last 1000 logs in memory to prevent overflow
        return updated.slice(0, 1000);
      });
    };

    socket.on("new-log", handleNewLog);

    return () => {
      console.log("useLogStream: leaving logs room");
      socket.emit("leave-logs");
      socket.off("new-log", handleNewLog);
    };
  }, [socket, isConnected]);

  const clearLogs = () => {
    console.log("useLogStream: clearing logs");
    setLogs([]);
  };

  return {
    logs,
    clearLogs,
    isConnected,
  };
}
