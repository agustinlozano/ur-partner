"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoomSocket } from "@/hooks/use-room-socket";
import { useGameStore, ROOM_EVENTS } from "@/stores/realtime-store";
import { CategoryList } from "@/components/realtime-category-list";
import { MainPanel } from "@/components/realtime-main-panel";
import { PartnerTracker } from "@/components/realtime-partner-tracker";
import { ChatDrawer } from "@/components/realtime-chat-drawer";
import { Button } from "@/components/ui/button";
import { LogOut, SparklesIcon, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSoundPlayer, SOUNDS } from "@/hooks/use-sound-store";
import { Room } from "@/lib/dynamodb";
import { useActiveRoom } from "@/hooks/use-active-room";

export default function RealtimeRoom({
  starfieldEnabled = true,
  onToggleStarfield,
  roomId,
  roomData,
}: {
  starfieldEnabled?: boolean;
  onToggleStarfield?: () => void;
  roomId: string;
  roomData: Room;
}) {
  const router = useRouter();
  const { activeRoom } = useActiveRoom();
  const playSound = useSoundPlayer();

  const {
    // State
    me,
    partner,
    mySlot,
    partnerSlot,
    myFixedCategory,
    partnerFixedCategory,
    myCompletedCategories,
    partnerCompletedCategories,
    myProgress,
    partnerProgress,
    myReady,
    partnerReady,
    partnerConnected,
    chatMessages,
    roomInitialized,
    socketConnected,

    // Actions
    initializeFromRoomData,
    setMyFixedCategory,
    setMyProgress,
    setMyReady,
    completeMyCategory,
    sendMessage,
    leaveRoom,
  } = useGameStore();

  // Initialize store with room data
  useEffect(() => {
    if (!activeRoom || !roomData || roomInitialized) return;

    console.log("🏠 Initializing RealtimeRoom with:", {
      roomId,
      userSlot: activeRoom.slot,
      roomData,
    });

    initializeFromRoomData(roomData, activeRoom.slot);
  }, [activeRoom, roomData, roomInitialized, initializeFromRoomData]);

  // Initialize WebSocket connection
  useRoomSocket(roomId, mySlot);

  // Handlers
  const handleCategorySelect = useCallback(
    (category: string) => {
      setMyFixedCategory(category);
      sendMessage(
        { type: ROOM_EVENTS.category_fixed, slot: mySlot, category },
        roomId
      );
    },
    [setMyFixedCategory, sendMessage, mySlot, roomId]
  );

  const handleImageUpload = useCallback(
    (file: File) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setMyProgress(progress);
        sendMessage(
          {
            type: ROOM_EVENTS.progress_updated,
            slot: mySlot,
            progress,
          },
          roomId
        );

        if (progress >= 100) {
          clearInterval(interval);
          if (myFixedCategory) {
            completeMyCategory(myFixedCategory);
            sendMessage(
              {
                type: ROOM_EVENTS.category_completed,
                slot: mySlot,
                category: myFixedCategory,
              },
              roomId
            );
          }
        }
      }, 200);
    },
    [
      setMyProgress,
      sendMessage,
      mySlot,
      myFixedCategory,
      completeMyCategory,
      roomId,
    ]
  );

  const handleToggleReady = useCallback(() => {
    const newReady = !myReady;
    setMyReady(newReady);
    if (newReady) {
      sendMessage({ type: ROOM_EVENTS.is_ready, slot: mySlot }, roomId);
    }
  }, [myReady, setMyReady, sendMessage, mySlot, roomId]);

  const handleSendMessage = useCallback(
    (message: string) => {
      sendMessage({ type: ROOM_EVENTS.say, slot: mySlot, message }, roomId);
    },
    [sendMessage, mySlot, roomId]
  );

  const handlePing = useCallback(() => {
    sendMessage({ type: ROOM_EVENTS.ping, slot: mySlot }, roomId);
  }, [sendMessage, mySlot, roomId]);

  const handleLeave = useCallback(() => {
    sendMessage({ type: ROOM_EVENTS.leave, slot: mySlot }, roomId);
    leaveRoom(roomId, () => {
      console.log("🏠 Redirecting to home after leaving room");
      router.push("/");
    });
  }, [leaveRoom, sendMessage, roomId, router, mySlot]);

  // Don't render until initialized
  if (!roomInitialized) {
    return (
      <div className="p-2 sm:p-4">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-2">Initializing room...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4">
      <div className="mx-auto">
        <div className="flex items-center justify-between w-full mb-6 select-none">
          <div className="flex items-center gap-2">
            <ChatDrawer
              messages={chatMessages}
              mySlot={mySlot}
              onSendMessage={handleSendMessage}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handlePing}
              className="gap-2 bg-transparent"
              disabled={!socketConnected}
            >
              <Zap className="h-4 w-4" />
              Ping
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (starfieldEnabled) {
                  playSound(SOUNDS.toggle_off);
                } else {
                  playSound(SOUNDS.tap);
                }
                onToggleStarfield?.();
              }}
              variant={starfieldEnabled ? "default" : "outline"}
              className={cn(
                "disabled:opacity-50 disabled:pointer-events-none",
                starfieldEnabled
                  ? "min-w-13 bg-emerald-900 border border-emerald-600 text-primary hover:bg-emerald-950 active:bg-emerald-600"
                  : ""
              )}
            >
              {starfieldEnabled ? "On" : "Off"}{" "}
              <SparklesIcon
                className={cn(
                  "size-4",
                  starfieldEnabled ? "text-emerald-200" : "text-red-400"
                )}
              />
            </Button>
          </div>
          <Button
            size="sm"
            onClick={handleLeave}
            className="gap-2 border border-red-400 bg-red-900 text-primary hover:bg-red-950 hover:text-white active:bg-red-800 disabled:opacity-50 disabled:pointer-events-none"
          >
            <LogOut className="size-4" />
            Leave
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <CategoryList
              selectedCategory={myFixedCategory}
              completedCategories={myCompletedCategories}
              onCategorySelect={handleCategorySelect}
              disabled={!socketConnected}
            />
          </div>

          <div className="lg:col-span-2">
            <MainPanel
              userSlot={mySlot}
              me={me}
              selectedCategory={myFixedCategory}
              progress={myProgress}
              isReady={myReady}
              onImageUpload={handleImageUpload}
              onToggleReady={handleToggleReady}
              onCategoryDrop={handleCategorySelect}
            />
          </div>

          <div className="lg:col-span-1">
            <PartnerTracker
              partner={partner}
              partnerSlot={partnerSlot}
              connected={partnerConnected}
              selectedCategory={partnerFixedCategory}
              completedCategories={partnerCompletedCategories}
              progress={partnerProgress}
              isReady={partnerReady}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
