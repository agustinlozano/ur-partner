"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { RelationshipRole } from "@/lib/role-utils";

interface ActiveRoom {
  room_id: string;
  // TODO: keep on this direction (u know what i mean ;))
  role: RelationshipRole;
  slot: "a" | "b";
  name: string;
  emoji: string;
  created_at: string;
}

export function useActiveRoom() {
  const [activeRoom, setActiveRoom] = useState<ActiveRoom | null>(null);
  const [forceRefresh, setForceRefresh] = useState(0);

  // Function to refresh the active room state
  const refreshActiveRoom = useCallback(() => {
    setForceRefresh((prev) => prev + 1);
  }, []);

  // Memoize setActive and clearActive to prevent infinite loops
  const setActive = useCallback((room: ActiveRoom) => {
    setActiveRoom(room);
    localStorage.setItem("activeRoom", JSON.stringify(room));
    // Trigger a refresh to ensure all components see the new state
    setForceRefresh((prev) => prev + 1);
  }, []);

  const clearActive = useCallback(async () => {
    // Get current activeRoom from state at the time of call
    const currentRoom = activeRoom;

    // If there's an active room, try to leave it in the database first
    if (currentRoom) {
      try {
        const response = await fetch(`/api/room/${currentRoom.room_id}/leave`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userSlot: currentRoom.slot,
          }),
        });

        if (!response.ok) {
          console.warn(
            "Failed to leave room in database, but clearing locally"
          );
        }
      } catch (error) {
        console.warn("Error leaving room in database:", error);
        // Continue with local cleanup even if API call fails
      }
    }

    // Always clear local state regardless of API success
    setActiveRoom(null);
    localStorage.removeItem("activeRoom");
    // Trigger a refresh to ensure all components see the cleared state
    setForceRefresh((prev) => prev + 1);
  }, [activeRoom]);

  // Function to verify if room still exists on server - make it independent
  const verifyRoomExists = useCallback(
    async (roomId: string) => {
      try {
        const response = await fetch(`/api/room-info/${roomId}`);
        if (!response.ok) {
          // Room doesn't exist on server, clear it from localStorage
          setActiveRoom(null);
          localStorage.removeItem("activeRoom");
          setForceRefresh((prev) => prev + 1);
        }
      } catch (error) {
        console.error("Error verifying room:", error);
        // On error, assume room doesn't exist and clear it
        setActiveRoom(null);
        localStorage.removeItem("activeRoom");
        setForceRefresh((prev) => prev + 1);
      }
    },
    [] // No dependencies to avoid circular dependency
  );

  // Load active room from localStorage on mount and when forceRefresh changes
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
          setActiveRoom(null);
        }
      } catch (error) {
        console.error("Error loading active room:", error);
        localStorage.removeItem("activeRoom");
        setActiveRoom(null);
      }
    } else {
      setActiveRoom(null);
    }
  }, [forceRefresh]); // Only depend on forceRefresh, not verifyRoomExists

  // Listen for storage events (when localStorage changes in other tabs/components)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "activeRoom") {
        refreshActiveRoom();
      }
    };

    // Listen for storage events
    window.addEventListener("storage", handleStorageChange);

    // Also listen for a custom event for same-page localStorage changes
    const handleCustomStorageChange = () => {
      refreshActiveRoom();
    };

    window.addEventListener("activeRoomChanged", handleCustomStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "activeRoomChanged",
        handleCustomStorageChange
      );
    };
  }, [refreshActiveRoom]);

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
    refreshActiveRoom,
  };
}
