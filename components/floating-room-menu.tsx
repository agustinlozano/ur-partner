"use client";

import { useState, useEffect } from "react";
import { useActiveRoom } from "@/hooks/use-active-room";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { useRouter, usePathname } from "next/navigation";
import { X, Users, Clock, ChevronUp, ChevronDown } from "lucide-react";

export default function FloatingRoomMenu() {
  const { activeRoom, clearActive, isRoomExpired, refreshActiveRoom } =
    useActiveRoom();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Refresh active room state when pathname changes
  useEffect(() => {
    refreshActiveRoom();
  }, [pathname, refreshActiveRoom]);

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
    setShowConfirmDialog(false);
  };

  return (
    <TooltipProvider>
      <div className="fixed md:bottom-6 md:right-6 bottom-4 right-4 z-50">
        <Card className="bg-card shadow-lg border overflow-hidden max-w-sm py-0">
          {/* Collapsed view */}
          {!isExpanded && (
            <div className="p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{activeRoom.emoji}</span>
                  <div className="text-sm">
                    <p className="font-medium">Active Room</p>
                    <p className="text-primary/85 text-xs">
                      {activeRoom.room_id}
                    </p>
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
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={goToRoom}
                        className="h-6 w-6 p-0"
                      >
                        <Users className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Go to room</p>
                    </TooltipContent>
                  </Tooltip>
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
                    <h3 className="font-semibold">Your Active Room</h3>
                    <p className="text-sm text-primary/85">
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
                  <span className="text-primary/85">Role:</span>
                  <span className="font-medium capitalize">
                    {activeRoom.role}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-primary/85">Name:</span>
                  <span className="font-medium">{activeRoom.name}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-primary/85">
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

                  <Dialog
                    open={showConfirmDialog}
                    onOpenChange={setShowConfirmDialog}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-shrink-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Leave room</p>
                      </TooltipContent>
                    </Tooltip>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Leave Room?</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to leave this room? You'll need
                          the room ID to rejoin.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setShowConfirmDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleLeaveRoom}>
                          Leave Room
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </TooltipProvider>
  );
}
