"use client";

import { useCallback, useMemo, useState } from "react";
import debounce from "lodash.debounce";
import { useRouter } from "next/navigation";
import { LogOut, SparklesIcon, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { CategoryList } from "@/components/realtime-category-list";
import { MainPanel } from "@/components/realtime-main-panel";
import { PartnerTracker } from "@/components/realtime-partner-tracker";
import { ChatDrawer } from "@/components/realtime-chat-drawer";
import { RealtimeRevealCard } from "@/components/realtime-reveal-card";

import { useGameStore, ROOM_EVENTS } from "@/stores/realtime-store";
import { usePersonalityImagesStore } from "@/stores/personality-images-store";

import { useSoundPlayer, SOUNDS } from "@/hooks/use-sound-store";
import { useRoomSocket } from "@/hooks/use-room-socket";
import { cn } from "@/lib/utils";

export default function RealtimeRoom({
  starfieldEnabled = true,
  onToggleStarfield,
  roomId,
}: {
  starfieldEnabled?: boolean;
  onToggleStarfield?: () => void;
  roomId: string;
}) {
  const router = useRouter();
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
    partnerProgress,
    myReady,
    partnerReady,
    partnerConnected,
    chatMessages,
    roomInitialized,
    socketConnected,
    lastPingTimestamp,

    // Actions
    setMyFixedCategory,
    completeMyCategory,
    sendMessage,
    leaveRoom,
    addChatMessage,
    checkAndSetReady,
    setMyReady,
  } = useGameStore();

  // Personality images store
  const { setImagesForRoom, getImagesForRoom, clearImagesForRoom } =
    usePersonalityImagesStore();
  // Handler para eliminar imagen de una categoría
  const handleRemoveImage = useCallback(
    (category: string) => {
      const currentImages = getImagesForRoom(roomId, mySlot);
      if (currentImages && currentImages[category]) {
        // Quitar imagen
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [category]: _removed, ...rest } = currentImages;
        setImagesForRoom(roomId, mySlot, rest);
      }
      // Remove from completed categories if it exists
      const { myCompletedCategories } = useGameStore.getState();
      const setMyCompletedCategories = (
        newList: typeof myCompletedCategories
      ) => {
        useGameStore.setState({ myCompletedCategories: newList });
      };
      if (myCompletedCategories.some((cat) => cat.category === category)) {
        setMyCompletedCategories(
          myCompletedCategories.filter((cat) => cat.category !== category)
        );
        // Sync via WebSocket
        sendMessage(
          { type: ROOM_EVENTS.category_uncompleted, slot: mySlot, category },
          roomId
        );

        if (myReady) {
          setMyReady(false);
          sendMessage({ type: ROOM_EVENTS.not_ready, slot: mySlot }, roomId);
        }
      }
    },
    [
      roomId,
      mySlot,
      myReady,
      getImagesForRoom,
      setImagesForRoom,
      sendMessage,
      setMyReady,
    ]
  );

  // Initialize WebSocket connection
  useRoomSocket(roomId, mySlot);

  // Get current images for this room and user
  const currentImages = getImagesForRoom(roomId, mySlot);

  // Note: No cleanup needed for base64 images, unlike blob URLs

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
      if (myFixedCategory) {
        // Convert File to base64 for persistent storage
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64Result = e.target?.result as string;

          // Store the uploaded image in the personality images store
          const currentImages = getImagesForRoom(roomId, mySlot);
          const newImages = {
            ...currentImages,
            [myFixedCategory]: base64Result,
          };
          setImagesForRoom(roomId, mySlot, newImages);
        };
        reader.readAsDataURL(file);

        // Complete the category immediately
        completeMyCategory(myFixedCategory);
        sendMessage(
          {
            type: ROOM_EVENTS.category_completed,
            slot: mySlot,
            category: myFixedCategory,
          },
          roomId
        );

        // Check if all categories are completed and set ready automatically
        setTimeout(() => {
          checkAndSetReady(roomId);
        }, 100);
      }
    },
    [
      sendMessage,
      mySlot,
      myFixedCategory,
      completeMyCategory,
      roomId,
      checkAndSetReady,
      getImagesForRoom,
      setImagesForRoom,
    ]
  );
  const handleSendMessage = useCallback(
    (message: string) => {
      addChatMessage(mySlot, message); // local echo
      sendMessage({ type: ROOM_EVENTS.say, slot: mySlot, message }, roomId);
    },
    [addChatMessage, sendMessage, mySlot, roomId]
  );

  // Debounced Ping button logic
  const [pingCooldown, setPingCooldown] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);

  // Check if both users are ready for reveal
  const canReveal = myReady && partnerReady;

  const debouncedPing = useMemo(
    () =>
      debounce(
        () => {
          sendMessage({ type: ROOM_EVENTS.ping, slot: mySlot }, roomId);
          setPingCooldown(true);
          setTimeout(() => setPingCooldown(false), 5000);
        },
        0,
        { leading: true, trailing: false }
      ),
    [sendMessage, mySlot, roomId]
  );

  const handlePing = useCallback(() => {
    if (!pingCooldown) {
      debouncedPing();
      toast.success("Ping sent to your partner", {
        duration: 2000,
        icon: "🔔",
      });
    }
  }, [debouncedPing, pingCooldown]);

  const handleLeave = useCallback(() => {
    // Clear images for this room and user slot when leaving
    clearImagesForRoom(roomId, mySlot);

    leaveRoom(roomId, () => {
      console.log("🏠 Redirecting to home after leaving room");
      router.push(`/room/${roomId}`);
    });
  }, [leaveRoom, roomId, router, clearImagesForRoom, mySlot]);

  const handleReveal = useCallback(() => {
    setIsRevealing(true);
    // Any additional reveal logic can be added here
    // The navigation is handled by RealtimeRevealCard
  }, []);

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
              partner={partner}
              messages={chatMessages}
              mySlot={mySlot}
              onSendMessage={handleSendMessage}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handlePing}
              className="gap-2 bg-transparent"
              disabled={!socketConnected || pingCooldown}
            >
              <Zap className="h-4 w-4" />
              {pingCooldown ? "Cooling" : "Ping"}
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
                "hidden lg:flex items-center gap-2",
                "disabled:opacity-50 disabled:pointer-events-none",
                starfieldEnabled
                  ? "min-w-13 bg-emerald-900 border border-emerald-600 text-primary hover:bg-emerald-950 active:bg-emerald-600"
                  : ""
              )}
            >
              <SparklesIcon
                className={cn(
                  "size-4",
                  starfieldEnabled ? "text-emerald-200" : "text-red-400"
                )}
              />
              {starfieldEnabled ? "On" : "Off"}{" "}
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
            {/* Reveal Card - appears when both users are ready */}
            <div className="mb-6">
              <RealtimeRevealCard
                roomId={roomId}
                canReveal={canReveal}
                isRevealing={isRevealing}
                onReveal={handleReveal}
              />
            </div>
            <MainPanel
              userSlot={mySlot}
              me={me}
              connected={socketConnected}
              selectedCategory={myFixedCategory}
              isReady={myReady}
              onImageUpload={handleImageUpload}
              onCategoryDrop={handleCategorySelect}
              ping={lastPingTimestamp}
              roomId={roomId}
              uploadedImages={currentImages}
              onRemoveImage={handleRemoveImage}
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
