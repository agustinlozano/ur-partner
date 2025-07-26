import { useEffect, useRef } from "react";
import { useGameStore, ROOM_EVENTS } from "@/stores/realtime-store";
import { WS_GATEWAY_URL } from "@/lib/env";

export function useRoomSocket(roomId: string, slot: "a" | "b") {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const isConnecting = useRef(false);
  const hasConnected = useRef(false);

  const {
    setSocket,
    setSocketConnected,
    handleMessage,
    sendMessage,
    roomInitialized,
    shouldReconnect,
    setShouldReconnect,
  } = useGameStore();

  useEffect(() => {
    setShouldReconnect(true); // Permitir reconexión al montar
    // Wait for room to be initialized before connecting
    if (!roomInitialized) return;

    // Prevent multiple simultaneous connections
    if (
      isConnecting.current ||
      socketRef.current?.readyState === WebSocket.OPEN
    ) {
      return;
    }

    const wsUrl = `${WS_GATEWAY_URL}?roomId=${roomId}&slot=${slot}`;

    const connectWebSocket = () => {
      if (isConnecting.current) return;

      isConnecting.current = true;
      console.log("🔌 Connecting to WebSocket:", wsUrl);

      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      setSocket(socket);

      socket.onopen = () => {
        console.log("✅ WebSocket connected");
        isConnecting.current = false;
        hasConnected.current = true;
        setSocketConnected(true);

        // Send get_in message after a brief delay to ensure connection is stable
        setTimeout(() => {
          sendMessage({ type: ROOM_EVENTS.get_in, slot }, roomId);
        }, 100);
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          console.log("📨 Received WebSocket message:", parsed);
          handleMessage(parsed);
        } catch (err) {
          console.error("❌ Invalid WebSocket message:", event.data);
        }
      };

      socket.onerror = (err) => {
        console.error("❌ WebSocket error:", err);
        isConnecting.current = false;
        setSocketConnected(false);
      };

      socket.onclose = (event) => {
        console.log("🔌 WebSocket closed:", event.code, event.reason);
        isConnecting.current = false;
        setSocketConnected(false);
        setSocket(null);

        // Only reconnect if we had a successful connection before and it wasn't a clean close
        if (
          shouldReconnect &&
          hasConnected.current &&
          event.code !== 1000 &&
          event.code !== 1001
        ) {
          reconnectTimer.current = setTimeout(() => {
            console.log("🔄 Attempting to reconnect WebSocket...");
            connectWebSocket();
          }, 3000); // Longer delay for reconnection
        }
      };
    };

    // Initial delay to avoid immediate connection attempts
    const initialDelay = setTimeout(() => {
      connectWebSocket();
    }, 500);

    return () => {
      clearTimeout(initialDelay);

      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }

      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        console.log("🔌 Closing WebSocket connection");
        socketRef.current.close(1000, "Component unmounting");
      }

      socketRef.current = null;
      isConnecting.current = false;
      setSocket(null);
      setSocketConnected(false);
    };
  }, [roomId, slot, roomInitialized, shouldReconnect]); // Agregar shouldReconnect a las dependencias
}
