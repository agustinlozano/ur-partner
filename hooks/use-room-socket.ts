import { useEffect, useRef } from "react";
import { useGameStore } from "@/stores/realtime-store";

export function useRoomSocket(roomId: string, slot: "a" | "b") {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const hasInitialized = useRef(false);

  const { setConnected, handleMessage, setSocket, connected } = useGameStore();

  useEffect(() => {
    // Prevent multiple connections
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const wsUrl = `ws://${process.env.NEXT_PUBLIC_WS_GATEWAY_URL}?roomId=${roomId}&slot=${slot}`;

    const connectWebSocket = () => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        return; // Already connected
      }

      console.log("Connecting to WebSocket:", wsUrl);
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      setSocket(socket);

      socket.onopen = () => {
        console.log("WebSocket connected");
        setConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          handleMessage(parsed);
        } catch (err) {
          console.error("Invalid WS message", event.data);
        }
      };

      socket.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        setConnected(false);
        setSocket(null);

        // Only reconnect if it wasn't a clean close
        if (event.code !== 1000 && event.code !== 1001) {
          reconnectTimer.current = setTimeout(() => {
            console.log("Attempting to reconnect...");
            connectWebSocket();
          }, 2000);
        }
      };

      socket.onerror = (err) => {
        console.error("WebSocket error:", err);
      };
    };

    connectWebSocket();

    return () => {
      hasInitialized.current = false;
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      if (socketRef.current) {
        socketRef.current.close(1000, "Component unmounting");
        socketRef.current = null;
      }
      setSocket(null);
    };
  }, [roomId, slot]); // Only depend on roomId and slot

  return { connected };
}
