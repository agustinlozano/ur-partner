"use client";

import { useCallback } from "react";
import { useRoomSocket } from "@/hooks/use-room-socket";
import { useGameStore, ROOM_EVENTS } from "@/stores/realtime-store";
import { CategoryList } from "@/components/realtime-category-list";
import { MainPanel } from "@/components/realtime-main-panel";
import { PartnerTracker } from "@/components/realtime-partner-tracker";
import { ChatDrawer } from "@/components/realtime-chat-drawer";
import { Button } from "@/components/ui/button";
import { LogOut, SparklesIcon, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSoundPlayer, SOUNDS } from "@/hooks/useSoundStore";

export default function RealtimeRoom({
  starfieldEnabled = true,
  onToggleStarfield,
}: {
  starfieldEnabled?: boolean;
  onToggleStarfield?: () => void;
} = {}) {
  const {
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
    chatMessages,
    setMyFixedCategory,
    setMyProgress,
    setMyReady,
    completeMyCategory,
    sendMessage,
  } = useGameStore();

  const playSound = useSoundPlayer();

  const { connected } = useRoomSocket("1234ABCD", mySlot);

  const handleCategorySelect = useCallback(
    (category: string) => {
      setMyFixedCategory(category);
      sendMessage({ type: ROOM_EVENTS.category_fixed, slot: mySlot, category });
    },
    [setMyFixedCategory, sendMessage, mySlot]
  );

  const handleImageUpload = useCallback(
    (file: File) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setMyProgress(progress);
        sendMessage({
          type: ROOM_EVENTS.progress_updated,
          slot: mySlot,
          progress,
        });

        if (progress >= 100) {
          clearInterval(interval);
          if (myFixedCategory) {
            completeMyCategory(myFixedCategory);
            sendMessage({
              type: ROOM_EVENTS.category_completed,
              slot: mySlot,
              category: myFixedCategory,
            });
          }
        }
      }, 200);
    },
    [setMyProgress, sendMessage, mySlot, myFixedCategory, completeMyCategory]
  );

  const handleToggleReady = useCallback(() => {
    const newReady = !myReady;
    setMyReady(newReady);
    if (newReady) {
      sendMessage({ type: ROOM_EVENTS.is_ready, slot: mySlot });
    }
  }, [myReady, setMyReady, sendMessage, mySlot]);

  const handleSendMessage = useCallback(
    (message: string) => {
      sendMessage({ type: ROOM_EVENTS.say, slot: mySlot, message });
    },
    [sendMessage, mySlot]
  );

  const handlePing = useCallback(() => {
    sendMessage({ type: ROOM_EVENTS.ping, slot: mySlot });
  }, [sendMessage, mySlot]);

  const handleLeave = useCallback(() => {
    sendMessage({ type: ROOM_EVENTS.leave, slot: mySlot });
  }, [sendMessage, mySlot]);

  return (
    <div className="p-2 sm:p-4">
      <div className="mx-auto">
        <div className="flex items-center justify-between w-full mb-6 select-none">
          {/* <h1 className="text-2xl font-bold">Couple Image Game</h1> */}
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
            >
              <Zap className="h-4 w-4" />
              Ping
            </Button>
            <Button
              // variant={starfieldEnabled ? "outline" : "ghost"}
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
                " disabled:opacity-50 disabled:pointer-events-none",
                starfieldEnabled
                  ? "min-w-13 bg-emerald-900 border border-emerald-600 text-primary hover:bg-emerald-950 active:bg-emerald-600"
                  : ""
              )}
            >
              {starfieldEnabled ? "On" : "Off"}{" "}
              <SparklesIcon
                className={cn(
                  "size-4",
                  starfieldEnabled ? " text-emerald-200" : "text-red-400"
                )}
              />
            </Button>
          </div>
          <Button
            // variant="outline"
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
            />
          </div>

          <div className="lg:col-span-2">
            <MainPanel
              userSlot={mySlot}
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
              partnerSlot={partnerSlot}
              connected={connected}
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
