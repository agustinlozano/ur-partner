"use client";

import { useState, useCallback } from "react";
import { useRoomSocket } from "@/hooks/use-room-socket";
import { CategoryList } from "@/components/realtime-category-list";
import { MainPanel } from "@/components/realtime-main-panel";
import { PartnerTracker } from "@/components/realtime-partner-tracker";
import { ChatDrawer } from "@/components/realtime-chat-drawer";
import { Button } from "@/components/ui/button";
import { LogOut, Zap } from "lucide-react";
import type { GameState, RoomEvent } from "@/components/realtime.types";

export default function RealtimeRoom() {
  const [gameState, setGameState] = useState<GameState>({
    mySlot: "a",
    partnerSlot: "b",
    myFixedCategory: null,
    partnerFixedCategory: null,
    myCompletedCategories: [],
    partnerCompletedCategories: ["animal", "place", "hobby"],
    myProgress: 0,
    partnerProgress: 75,
    myReady: false,
    partnerReady: true,
    connected: false,
    chatMessages: [
      {
        slot: "b",
        message: "Hey! Ready to play?",
        timestamp: Date.now() - 60000,
      },
      {
        slot: "a",
        message: "Yes! Let's do this 🎮",
        timestamp: Date.now() - 30000,
      },
    ],
  });

  const handleMessage = useCallback((event: RoomEvent) => {
    setGameState((prev) => {
      const newState = { ...prev };

      switch (event.type) {
        case "category_fixed":
          if (event.slot === newState.mySlot) {
            newState.myFixedCategory = event.category;
          } else {
            newState.partnerFixedCategory = event.category;
          }
          break;

        case "category_completed":
          if (event.slot === newState.mySlot) {
            newState.myCompletedCategories = [
              ...newState.myCompletedCategories,
              event.category,
            ];
          } else {
            newState.partnerCompletedCategories = [
              ...newState.partnerCompletedCategories,
              event.category,
            ];
          }
          break;

        case "progress_updated":
          if (event.slot === newState.mySlot) {
            newState.myProgress = event.progress;
          } else {
            newState.partnerProgress = event.progress;
          }
          break;

        case "is_ready":
          if (event.slot === newState.mySlot) {
            newState.myReady = true;
          } else {
            newState.partnerReady = true;
          }
          break;

        case "say":
          newState.chatMessages = [
            ...newState.chatMessages,
            { slot: event.slot, message: event.message, timestamp: Date.now() },
          ];
          break;
      }

      return newState;
    });
  }, []);

  const { connected, send } = useRoomSocket("1234ABCD", gameState.mySlot, {
    onMessage: handleMessage,
    onConnect: () => setGameState((prev) => ({ ...prev, connected: true })),
    onDisconnect: () => setGameState((prev) => ({ ...prev, connected: false })),
  });

  const handleCategorySelect = useCallback(
    (category: string) => {
      setGameState((prev) => ({ ...prev, myFixedCategory: category }));
      send({ type: "category_fixed", slot: gameState.mySlot, category });
    },
    [send, gameState.mySlot]
  );

  const handleImageUpload = useCallback(
    (file: File) => {
      // Simulate progress updates
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setGameState((prev) => ({ ...prev, myProgress: progress }));
        send({ type: "progress_updated", slot: gameState.mySlot, progress });

        if (progress >= 100) {
          clearInterval(interval);
          if (gameState.myFixedCategory) {
            setGameState((prev) => ({
              ...prev,
              myCompletedCategories: [
                ...prev.myCompletedCategories,
                gameState.myFixedCategory!,
              ],
              myFixedCategory: null,
              myProgress: 0,
            }));
            send({
              type: "category_completed",
              slot: gameState.mySlot,
              category: gameState.myFixedCategory,
            });
          }
        }
      }, 200);
    },
    [send, gameState.mySlot, gameState.myFixedCategory]
  );

  const handleToggleReady = useCallback(() => {
    const newReady = !gameState.myReady;
    setGameState((prev) => ({ ...prev, myReady: newReady }));
    if (newReady) {
      send({ type: "is_ready", slot: gameState.mySlot });
    }
  }, [send, gameState.mySlot, gameState.myReady]);

  const handleSendMessage = useCallback(
    (message: string) => {
      send({ type: "say", slot: gameState.mySlot, message });
    },
    [send, gameState.mySlot]
  );

  const handlePing = useCallback(() => {
    send({ type: "ping", slot: gameState.mySlot });
  }, [send, gameState.mySlot]);

  const handleLeave = useCallback(() => {
    send({ type: "leave", slot: gameState.mySlot });
  }, [send, gameState.mySlot]);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Couple Image Game</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePing}
              className="gap-2 bg-transparent"
            >
              <Zap className="h-4 w-4" />
              Ping
            </Button>
            <ChatDrawer
              messages={gameState.chatMessages}
              mySlot={gameState.mySlot}
              onSendMessage={handleSendMessage}
            />
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLeave}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Leave
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <CategoryList
              selectedCategory={gameState.myFixedCategory}
              completedCategories={gameState.myCompletedCategories}
              onCategorySelect={handleCategorySelect}
            />
          </div>

          <div className="lg:col-span-2">
            <MainPanel
              userSlot={gameState.mySlot}
              selectedCategory={gameState.myFixedCategory}
              progress={gameState.myProgress}
              isReady={gameState.myReady}
              onImageUpload={handleImageUpload}
              onToggleReady={handleToggleReady}
              onCategoryDrop={handleCategorySelect}
            />
          </div>

          <div className="lg:col-span-1">
            <PartnerTracker
              partnerSlot={gameState.partnerSlot}
              connected={connected}
              selectedCategory={gameState.partnerFixedCategory}
              completedCategories={gameState.partnerCompletedCategories}
              progress={gameState.partnerProgress}
              isReady={gameState.partnerReady}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
