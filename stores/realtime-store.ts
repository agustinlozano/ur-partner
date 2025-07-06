import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type RoomEvent =
  | { type: "category_fixed"; slot: "a" | "b"; category: string }
  | { type: "category_completed"; slot: "a" | "b"; category: string }
  | { type: "progress_updated"; slot: "a" | "b"; progress: number }
  | { type: "is_ready"; slot: "a" | "b" }
  | { type: "say"; slot: "a" | "b"; message: string }
  | { type: "ping"; slot: "a" | "b" }
  | { type: "leave"; slot: "a" | "b" };

export interface GameState {
  mySlot: "a" | "b";
  partnerSlot: "a" | "b";
  myFixedCategory: string | null;
  partnerFixedCategory: string | null;
  myCompletedCategories: string[];
  partnerCompletedCategories: string[];
  myProgress: number;
  partnerProgress: number;
  myReady: boolean;
  partnerReady: boolean;
  connected: boolean;
  chatMessages: Array<{
    slot: "a" | "b";
    message: string;
    timestamp: number;
  }>;
}

interface GameStore extends GameState {
  // Actions
  setConnected: (connected: boolean) => void;
  handleMessage: (event: RoomEvent) => void;
  setMyFixedCategory: (category: string | null) => void;
  setMyProgress: (progress: number) => void;
  setMyReady: (ready: boolean) => void;
  completeMyCategory: (category: string) => void;
  addChatMessage: (slot: "a" | "b", message: string) => void;
  resetMyProgress: () => void;

  // WebSocket
  socket: WebSocket | null;
  setSocket: (socket: WebSocket | null) => void;
  sendMessage: (event: RoomEvent) => void;
}

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
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
    socket: null,

    // Actions
    setConnected: (connected) => set({ connected }),

    setSocket: (socket) => set({ socket }),

    sendMessage: (event) => {
      const { socket, connected } = get();
      if (connected && socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ ...event, roomId: "1234ABCD" }));
      } else {
        console.warn("Cannot send WS message: socket not ready");
      }
    },

    handleMessage: (event) => {
      console.log("[WS BROADCAST]", event);
      const state = get();

      switch (event.type) {
        case "category_fixed":
          if (event.slot === state.mySlot) {
            if (state.myFixedCategory !== event.category) {
              set({ myFixedCategory: event.category });
            }
          } else {
            if (state.partnerFixedCategory !== event.category) {
              set({ partnerFixedCategory: event.category });
            }
          }
          break;

        case "category_completed":
          if (event.slot === state.mySlot) {
            if (!state.myCompletedCategories.includes(event.category)) {
              set({
                myCompletedCategories: [
                  ...state.myCompletedCategories,
                  event.category,
                ],
              });
            }
          } else {
            if (!state.partnerCompletedCategories.includes(event.category)) {
              set({
                partnerCompletedCategories: [
                  ...state.partnerCompletedCategories,
                  event.category,
                ],
              });
            }
          }
          break;

        case "progress_updated":
          if (event.slot === state.mySlot) {
            if (state.myProgress !== event.progress) {
              set({ myProgress: event.progress });
            }
          } else {
            if (state.partnerProgress !== event.progress) {
              set({ partnerProgress: event.progress });
            }
          }
          break;

        case "is_ready":
          if (event.slot === state.mySlot) {
            if (!state.myReady) {
              set({ myReady: true });
            }
          } else {
            if (!state.partnerReady) {
              set({ partnerReady: true });
            }
          }
          break;

        case "say":
          set({
            chatMessages: [
              ...state.chatMessages,
              {
                slot: event.slot,
                message: event.message,
                timestamp: Date.now(),
              },
            ],
          });
          break;
      }
    },

    setMyFixedCategory: (category) => set({ myFixedCategory: category }),
    setMyProgress: (progress) => set({ myProgress: progress }),
    setMyReady: (ready) => set({ myReady: ready }),
    resetMyProgress: () => set({ myProgress: 0 }),

    completeMyCategory: (category) => {
      const state = get();
      set({
        myCompletedCategories: [...state.myCompletedCategories, category],
        myFixedCategory: null,
        myProgress: 0,
      });
    },

    addChatMessage: (slot, message) => {
      const state = get();
      set({
        chatMessages: [
          ...state.chatMessages,
          {
            slot,
            message,
            timestamp: Date.now(),
          },
        ],
      });
    },
  }))
);
