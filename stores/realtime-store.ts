import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { Room } from "@/lib/dynamodb";

export type RoomEvent =
  | { type: "category_fixed"; slot: "a" | "b"; category: string }
  | { type: "category_completed"; slot: "a" | "b"; category: string }
  | { type: "progress_updated"; slot: "a" | "b"; progress: number }
  | { type: "is_ready"; slot: "a" | "b" }
  | { type: "say"; slot: "a" | "b"; message: string }
  | { type: "ping"; slot: "a" | "b" }
  | { type: "leave"; slot: "a" | "b" }
  | { type: "get_in"; slot: "a" | "b" };

export const ROOM_EVENTS = {
  category_fixed: "category_fixed",
  category_completed: "category_completed",
  progress_updated: "progress_updated",
  is_ready: "is_ready",
  say: "say",
  ping: "ping",
  leave: "leave",
  get_in: "get_in",
} as const;

export type RoomEventType = (typeof ROOM_EVENTS)[keyof typeof ROOM_EVENTS];

export interface GameState {
  // User identification
  mySlot: "a" | "b";
  partnerSlot: "a" | "b";
  me: { name: string; avatar: string };
  partner: { name: string; avatar: string };
  // Flag para controlar reconexión del WebSocket
  shouldReconnect: boolean;

  // My state
  myFixedCategory: string | null;
  myCompletedCategories: string[];
  myProgress: number;
  myReady: boolean;

  // Partner state
  partnerFixedCategory: string | null;
  partnerCompletedCategories: string[];
  partnerProgress: number;
  partnerReady: boolean;
  partnerConnected: boolean;

  // Room state
  roomInitialized: boolean;
  chatMessages: Array<{
    slot: "a" | "b";
    message: string;
    timestamp: number;
  }>;

  // Chat state
  unreadMessagesCount: number;
  lastReadMessageTimestamp: number;

  // WebSocket state
  socket: WebSocket | null;
  socketConnected: boolean;
}

interface GameStore extends GameState {
  // Initialization
  initializeFromRoomData: (roomData: Room, mySlot: "a" | "b") => void;
  resetState: () => void;

  // My actions
  setMyFixedCategory: (category: string | null) => void;
  setMyProgress: (progress: number) => void;
  setMyReady: (ready: boolean) => void;
  completeMyCategory: (category: string) => void;
  resetMyProgress: () => void;

  // Partner actions (only updated via WebSocket)
  setPartnerConnected: (connected: boolean) => void;

  // Chat
  addChatMessage: (slot: "a" | "b", message: string) => void;
  markMessagesAsRead: () => void;
  getUnreadCount: () => number;

  // WebSocket
  setSocket: (socket: WebSocket | null) => void;
  setSocketConnected: (connected: boolean) => void;
  sendMessage: (event: RoomEvent, roomId: string) => void;
  handleMessage: (event: RoomEvent) => void;

  // Room actions
  leaveRoom: (roomId: string, onLeave?: () => void) => void;

  // Reconexión manual
  reconnectSocket: (roomId: string, mySlot: "a" | "b") => void;

  // Flag para controlar reconexión del WebSocket
  setShouldReconnect: (value: boolean) => void;
}

const initialState: GameState = {
  mySlot: "a",
  partnerSlot: "b",
  me: { name: "me", avatar: "me" },
  shouldReconnect: true,
  partner: { name: "partner", avatar: "partner" },
  myFixedCategory: null,
  myCompletedCategories: [],
  myProgress: 0,
  myReady: false,
  partnerFixedCategory: null,
  partnerCompletedCategories: [],
  partnerProgress: 0,
  partnerReady: false,
  partnerConnected: false,
  roomInitialized: false,
  chatMessages: [],
  unreadMessagesCount: 0,
  lastReadMessageTimestamp: 0,
  socket: null,
  socketConnected: false,
};

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Initialize state from room data
    initializeFromRoomData: (roomData: Room, mySlot: "a" | "b") => {
      const partnerSlot = mySlot === "a" ? "b" : "a";

      console.log("🔄 Initializing store from roomData:", {
        roomData,
        mySlot,
        partnerSlot,
      });

      const me = {
        name: roomData[`${mySlot}_name`] || "me",
        avatar: roomData[`${mySlot}_emoji`] || "me",
      };

      const partner = {
        name: roomData[`${partnerSlot}_name`] || "partner",
        avatar: roomData[`${partnerSlot}_emoji`] || "partner",
      };

      set({
        mySlot,
        partnerSlot,
        me,
        partner,
        // Initialize my state from roomData
        myFixedCategory: roomData[`realtime_${mySlot}_fixed_category`] || null,
        myCompletedCategories:
          roomData[`realtime_${mySlot}_completed_categories`] || [],
        myProgress: roomData[`realtime_${mySlot}_progress`] || 0,
        myReady: !!roomData[`realtime_${mySlot}_ready`],

        // Initialize partner state from roomData
        partnerFixedCategory:
          roomData[`realtime_${partnerSlot}_fixed_category`] || null,
        partnerCompletedCategories:
          roomData[`realtime_${partnerSlot}_completed_categories`] || [],
        partnerProgress: roomData[`realtime_${partnerSlot}_progress`] || 0,
        partnerReady: !!roomData[`realtime_${partnerSlot}_ready`],
        partnerConnected: !!roomData[`realtime_in_room_${partnerSlot}`],

        // Initialize chat messages
        chatMessages: roomData.realtime_chat_messages
          ? JSON.parse(roomData.realtime_chat_messages as any)
          : [],

        roomInitialized: true,
      });
    },

    resetState: () => {
      set(initialState);
    },

    // My actions
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

    // Partner actions
    setPartnerConnected: (connected) => set({ partnerConnected: connected }),

    // Chat
    addChatMessage: (slot, message) => {
      const state = get();
      const timestamp = Date.now();
      set({
        chatMessages: [...state.chatMessages, { slot, message, timestamp }],
        // Increment unread count only for partner messages
        unreadMessagesCount:
          slot !== state.mySlot
            ? state.unreadMessagesCount + 1
            : state.unreadMessagesCount,
      });
    },

    markMessagesAsRead: () => {
      set({ unreadMessagesCount: 0, lastReadMessageTimestamp: Date.now() });
    },

    getUnreadCount: () => {
      return get().unreadMessagesCount;
    },

    // WebSocket
    setSocket: (socket) => set({ socket }),
    setSocketConnected: (connected) => set({ socketConnected: connected }),

    sendMessage: (event, roomId) => {
      const { socket, socketConnected } = get();
      console.log("📤 Sending message:", event, roomId);

      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ ...event, roomId }));
      } else if (
        socketConnected &&
        socket?.readyState === WebSocket.CONNECTING
      ) {
        // Wait a bit for connection to be ready
        setTimeout(() => {
          const { socket: currentSocket } = get();
          if (currentSocket?.readyState === WebSocket.OPEN) {
            currentSocket.send(JSON.stringify({ ...event, roomId }));
          } else {
            console.warn("⚠️ Cannot send message: WebSocket connection failed");
          }
        }, 200);
      } else {
        console.warn("⚠️ Cannot send message: WebSocket not connected");
      }
    },

    handleMessage: (event) => {
      console.log("📥 Handling message:", event);
      const state = get();

      switch (event.type) {
        case "get_in":
          // Partner joined the room
          if (event.slot !== state.mySlot) {
            set({ partnerConnected: true });
          }
          break;

        case "leave":
          // Partner left the room
          if (event.slot !== state.mySlot) {
            set({ partnerConnected: false });
          }
          break;

        case "category_fixed":
          if (event.slot === state.mySlot) {
            set({ myFixedCategory: event.category });
          } else {
            set({ partnerFixedCategory: event.category });
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
            set({ myProgress: event.progress });
          } else {
            set({ partnerProgress: event.progress });
          }
          break;

        case "is_ready":
          if (event.slot === state.mySlot) {
            set({ myReady: true });
          } else {
            set({ partnerReady: true });
          }
          break;

        case "say":
          get().addChatMessage(event.slot, event.message);
          break;

        case "ping":
          // Handle ping if needed
          break;
      }
    },

    // Room actions
    leaveRoom: async (roomId: string, onLeave?: () => void) => {
      const { socket, mySlot, sendMessage, setShouldReconnect } = get();

      console.log("🚪 Leaving room:", roomId);

      // avoid reconnection loop
      setShouldReconnect(false);

      // Send leave message via WebSocket
      if (socket?.readyState === WebSocket.OPEN) {
        sendMessage({ type: ROOM_EVENTS.leave, slot: mySlot }, roomId);
      }

      // Close WebSocket connection
      if (socket) {
        socket.close(1000, "User leaving room");
      }

      // Reset state
      get().resetState();

      // Execute callback (usually redirect to home)
      if (onLeave) {
        onLeave();
      }
    },

    // Reconnect socket manually
    reconnectSocket: (roomId, mySlot) => {
      // Reset reconnection flag and socket
      get().setShouldReconnect(true);
      const { socket } = get();
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close(4000, "Manual reconnect");
      }
      // The useRoomSocket hook should react to shouldReconnect and recreate the socket
    },

    // Flag to control WebSocket reconnection
    setShouldReconnect: (value: boolean) => set({ shouldReconnect: value }),
  }))
);
