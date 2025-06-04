"use client";

import { useState, useEffect } from "react";
import { useActiveRoom } from "@/hooks/use-active-room";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useRouter, usePathname } from "next/navigation";
import { X, Users, Clock, ChevronUp, ChevronDown } from "lucide-react";

export default function FloatingRoomMenu() {
  const { activeRoom, clearActive, isRoomExpired } = useActiveRoom();
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Check if room is expired and clear it if needed
  useEffect(() => {
    if (activeRoom && isRoomExpired) {
      clearActive();
    }
  }, [activeRoom, isRoomExpired, clearActive]);

  if (!activeRoom || isRoomExpired) return null;

  // Don't show on the room page itself
  if (pathname === `/room/${activeRoom.room_id}`) return null;

  const timeRemaining = () => {
    const createdAt = new Date(activeRoom.created_at);
    const now = new Date();
    const diffInHours =
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    const remaining = 2.5 - diffInHours;

    if (remaining <= 0) return "Expired";

    const hours = Math.floor(remaining);
    const minutes = Math.floor((remaining - hours) * 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const goToRoom = () => {
    router.push(`/room/${activeRoom.room_id}`);
  };

  const handleLeaveRoom = () => {
    clearActive();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="bg-white shadow-lg border border-gray-200 overflow-hidden max-w-sm">
        {/* Collapsed view */}
        {!isExpanded && (
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{activeRoom.emoji}</span>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">Active Room</p>
                  <p className="text-gray-500 text-xs">{activeRoom.room_id}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(true)}
                  className="h-6 w-6 p-0"
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToRoom}
                  className="h-6 w-6 p-0"
                >
                  <Users className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Expanded view */}
        {isExpanded && (
          <div className="p-4 min-w-[280px]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{activeRoom.emoji}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Your Active Room
                  </h3>
                  <p className="text-sm text-gray-500">
                    Room {activeRoom.room_id}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-6 w-6 p-0"
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Role:</span>
                <span className="font-medium capitalize">
                  {activeRoom.role}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{activeRoom.name}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-gray-600">
                  <Clock className="h-3 w-3" />
                  <span>Expires in:</span>
                </div>
                <span className="font-medium text-orange-600">
                  {timeRemaining()}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={goToRoom}
                  variant="default"
                  size="sm"
                  className="flex-1"
                >
                  <Users className="h-3 w-3 mr-1" />
                  Go to Room
                </Button>

                <Button
                  onClick={handleLeaveRoom}
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
