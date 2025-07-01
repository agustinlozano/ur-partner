"use client";

import { useEffect } from "react";
import { useActiveRoom } from "@/hooks/use-active-room";

interface ActiveRoomSaverProps {
  roomId: string;
  role: "girlfriend" | "boyfriend";
  slot: "a" | "b";
  name: string;
  emoji: string;
}

export default function ActiveRoomSaver({
  roomId,
  role,
  slot,
  name,
  emoji,
}: ActiveRoomSaverProps) {
  const { setActive } = useActiveRoom();

  useEffect(() => {
    // Save the active room data to localStorage
    setActive({
      room_id: roomId,
      role,
      slot,
      name,
      emoji,
      created_at: new Date().toISOString(),
    });

    // Dispatch custom event to notify other components about the change
    window.dispatchEvent(new Event("activeRoomChanged"));
  }, [roomId, role, slot, name, emoji, setActive]);

  // This component doesn't render anything
  return null;
}
