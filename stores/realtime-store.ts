import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { CompletedCategory, Room } from "@/lib/dynamodb";
import type { RoomEvent, UploadedImage } from "@/components/realtime.types";

export const ROOM_EVENTS = {
  category_fixed: "category_fixed",
  category_completed: "category_completed",
  category_uncompleted: "category_uncompleted",
  progress_updated: "progress_updated",
  image_uploaded: "image_uploaded",
  is_ready: "is_ready",
  not_ready: "not_ready",
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
  reconnectTrigger: number;

  // My state
  myFixedCategory: string | null;
  myCompletedCategories: CompletedCategory[];
  myProgress: number;
  myReady: boolean;

  // Partner state
  partnerFixedCategory: string | null;
  partnerCompletedCategories: CompletedCategory[];
  partnerProgress: number;
  partnerReady: boolean;
  partnerConnected: boolean;
  partnerUploadedImages: UploadedImage[]; // Store partner's uploaded image payloads

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
  reconnecting: boolean;

  // Ping state
  lastPingTimestamp: number;
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
  checkAndSetReady: (roomId: string) => void;

  // Partner actions (only updated via WebSocket)
  setPartnerConnected: (connected: boolean) => void;
  addPartnerUploadedImage: (imageData: UploadedImage) => void;
  clearPartnerUploadedImages: () => void;

  // Chat
  addChatMessage: (slot: "a" | "b", message: string) => void;
  markMessagesAsRead: () => void;
  getUnreadCount: () => number;

  // WebSocket
  setSocket: (socket: WebSocket | null) => void;
  setSocketConnected: (connected: boolean) => void;
  setReconnecting: (reconnecting: boolean) => void;
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
  reconnectTrigger: 0,
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
  partnerUploadedImages: [],
  roomInitialized: false,
  chatMessages: [],
  unreadMessagesCount: 0,
  lastReadMessageTimestamp: 0,
  socket: null,
  socketConnected: false,
  reconnecting: false,
  lastPingTimestamp: 0,
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

    completeMyCategory: (category: string) => {
      const state = get();
      const newCompletedCategories = [
        ...state.myCompletedCategories,
        { category, value: new Date().toISOString() },
      ];
      set({
        myCompletedCategories: newCompletedCategories,
        myFixedCategory: null,
        myProgress: 0,
      });

      // Check if all 8 categories are completed and set ready automatically
      if (newCompletedCategories.length === 9 && !state.myReady) {
        console.log(
          "🎯 All categories completed! Setting ready state and sending to WebSocket"
        );
        set({ myReady: true });
        // Send the ready message to WebSocket immediately
        // Note: We need roomId, but this function doesn't have it, so we'll handle it in checkAndSetReady
      }
    },

    // Check if all categories are completed and set ready state
    checkAndSetReady: (roomId: string) => {
      const state = get();
      if (state.myCompletedCategories.length === 9) {
        console.log(
          "🎯 All categories completed! Setting ready state and sending message"
        );
        if (!state.myReady) {
          set({ myReady: true });
        }
        // Always send the message when all categories are completed
        state.sendMessage(
          { type: ROOM_EVENTS.is_ready, slot: state.mySlot },
          roomId
        );
      }
    },

    // Partner actions
    setPartnerConnected: (connected) => set({ partnerConnected: connected }),
    addPartnerUploadedImage: (imageData) => {
      const state = get();
      set({
        partnerUploadedImages: [...state.partnerUploadedImages, imageData],
      });
    },
    clearPartnerUploadedImages: () => set({ partnerUploadedImages: [] }),

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
    setReconnecting: (reconnecting) => set({ reconnecting }),

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
        case "not_ready":
          if (event.slot === state.mySlot) {
            // No hacemos nada para el usuario local
          } else {
            if (state.partnerReady) {
              set({ partnerReady: false });
            }
          }
          break;
        case "category_uncompleted":
          if (event.slot === state.mySlot) {
            // No hacemos nada, ya que el usuario local ya lo gestionó
          } else {
            // El partner descompletó una categoría: la quitamos de partnerCompletedCategories
            if (
              state.partnerCompletedCategories.some(
                (cat) => cat.category === event.category
              )
            ) {
              set({
                partnerCompletedCategories:
                  state.partnerCompletedCategories.filter(
                    (cat) => cat.category !== event.category
                  ),
              });
            }
          }
          break;
        case "get_in":
          // Partner joined the room
          if (event.slot !== state.mySlot) {
            set({ partnerConnected: true });
          }
          break;

        case "leave":
          // Partner left the room
          if (event.slot !== state.mySlot) {
            set({
              partnerConnected: false,
              partnerUploadedImages: [], // Clear partner's uploaded images when they leave
            });
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
            if (
              !state.myCompletedCategories.some(
                (cat) => cat.category === event.category
              )
            ) {
              set({
                myCompletedCategories: [
                  ...state.myCompletedCategories,
                  { category: event.category, value: new Date().toISOString() },
                ],
              });
            }
          } else {
            if (
              !state.partnerCompletedCategories.some(
                (cat) => cat.category === event.category
              )
            ) {
              set({
                partnerCompletedCategories: [
                  ...state.partnerCompletedCategories,
                  { category: event.category, value: new Date().toISOString() },
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

        case "image_uploaded":
          // Only handle partner's image uploads (not our own)
          if (event.slot !== state.mySlot) {
            const { payload } = event;

            // Add the uploaded image data to the store
            get().addPartnerUploadedImage(payload);

            // Show a toast notification about partner's upload
            import("sonner").then(({ toast }) => {
              const formatBytes = (bytes: number): string => {
                if (bytes === 0) return "0 Bytes";
                const k = 1024;
                const sizes = ["Bytes", "KB", "MB", "GB"];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return (
                  parseFloat((bytes / Math.pow(k, i)).toFixed(1)) +
                  " " +
                  sizes[i]
                );
              };

              toast.success(`Partner uploaded image for ${payload.category}`, {
                description: `${payload.fileName} (${formatBytes(
                  payload.compressedSize
                )})`,
                duration: 3000,
                icon: "📸",
              });
            });
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
          set({ lastPingTimestamp: Date.now() });
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
    reconnectSocket: (roomId: string, mySlot: "a" | "b") => {
      console.log(
        "🔄 Manual reconnect triggered for room:",
        roomId,
        "slot:",
        mySlot
      );

      // Set reconnecting state for user feedback
      set({ reconnecting: true });

      // Close existing socket if open
      const { socket } = get();
      if (socket) {
        if (socket.readyState === WebSocket.OPEN) {
          socket.close(4000, "Manual reconnect");
        }
        // Clear the socket immediately
        set({ socket: null, socketConnected: false });
      }

      // Reset reconnection flag and increment trigger to force re-connection
      set({
        shouldReconnect: true,
        reconnectTrigger: get().reconnectTrigger + 1,
      });

      // Clear reconnecting state after a delay (the useRoomSocket hook will handle actual reconnection)
      setTimeout(() => {
        const currentState = get();
        if (currentState.reconnecting) {
          set({ reconnecting: false });
        }
      }, 5000); // Clear reconnecting state after 5 seconds max
    },

    // Flag to control WebSocket reconnection
    setShouldReconnect: (value: boolean) => set({ shouldReconnect: value }),
  }))
);
