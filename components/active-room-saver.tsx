"use client";

import { useEffect } from "react";
import { useActiveRoom } from "@/hooks/use-active-room";

interface ActiveRoomSaverProps {
  roomId: string;
  role: "girlfriend" | "boyfriend";
  name: string;
  emoji: string;
}

export default function ActiveRoomSaver({
  roomId,
  role,
  name,
  emoji,
}: ActiveRoomSaverProps) {
  const { setActive } = useActiveRoom();

  useEffect(() => {
    // Save the active room data to localStorage
    setActive({
      room_id: roomId,
      role,
      name,
      emoji,
      created_at: new Date().toISOString(),
    });
  }, [roomId, role, name, emoji, setActive]);

  // This component doesn't render anything
  return null;
}
