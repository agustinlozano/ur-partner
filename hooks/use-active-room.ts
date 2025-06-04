"use client";

import { useState, useEffect, useMemo, useCallback } from "react";

interface ActiveRoom {
  room_id: string;
  role: "girlfriend" | "boyfriend";
  name: string;
  emoji: string;
  created_at: string;
}

export function useActiveRoom() {
  const [activeRoom, setActiveRoom] = useState<ActiveRoom | null>(null);

  // Memoize setActive and clearActive to prevent infinite loops
  const setActive = useCallback((room: ActiveRoom) => {
    setActiveRoom(room);
    localStorage.setItem("activeRoom", JSON.stringify(room));
  }, []);

  const clearActive = useCallback(() => {
    setActiveRoom(null);
    localStorage.removeItem("activeRoom");
  }, []);

  // Function to verify if room still exists on server
  const verifyRoomExists = useCallback(
    async (roomId: string) => {
      try {
        const response = await fetch(`/api/room-info/${roomId}`);
        if (!response.ok) {
          // Room doesn't exist on server, clear it from localStorage
          clearActive();
        }
      } catch (error) {
        console.error("Error verifying room:", error);
        // On error, assume room doesn't exist and clear it
        clearActive();
      }
    },
    [clearActive]
  );

  // Load active room from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("activeRoom");
    if (stored) {
      try {
        const room = JSON.parse(stored) as ActiveRoom;
        // Check if room is not expired (2.5 hours)
        const createdAt = new Date(room.created_at);
        const now = new Date();
        const diffInHours =
          (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

        if (diffInHours <= 2.5) {
          setActiveRoom(room); // Use setActiveRoom directly here, not setActive
          // Verify room still exists on server
          verifyRoomExists(room.room_id);
        } else {
          // Room expired, clear it
          localStorage.removeItem("activeRoom");
        }
      } catch (error) {
        console.error("Error loading active room:", error);
        localStorage.removeItem("activeRoom");
      }
    }
  }, [verifyRoomExists]); // Only depend on verifyRoomExists

  // Compute if room is expired as a memoized value
  const isRoomExpired = useMemo(() => {
    if (!activeRoom) return true;

    const createdAt = new Date(activeRoom.created_at);
    const now = new Date();
    const diffInHours =
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    return diffInHours > 2.5;
  }, [activeRoom]);

  return {
    activeRoom,
    setActive,
    clearActive,
    isRoomExpired,
    verifyRoomExists,
  };
}
