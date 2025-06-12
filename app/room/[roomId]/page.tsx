"use client";

import { Button } from "@/components/ui/button";
import { getRoomData } from "@/lib/actions";
import GradientBackground from "@/components/gradient-background";
import Link from "next/link";
import ActiveRoomSaver from "@/components/active-room-saver";
import CopyRoomId from "@/components/copy-room-id";
import AudioTrigger from "@/components/audio-trigger";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";

interface PageProps {
  params: Promise<{ roomId: string }>;
  searchParams?: Promise<{
    new?: string;
    role?: "girlfriend" | "boyfriend";
    name?: string;
    emoji?: string;
  }>;
}

interface RoomData {
  room_id: string;
  created_at: string;
  girlfriend_name?: string;
  girlfriend_emoji?: string;
  boyfriend_name?: string;
  boyfriend_emoji?: string;
}

export default function RoomDetailPage({ params, searchParams }: PageProps) {
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [roomId, setRoomId] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<{
    role?: "girlfriend" | "boyfriend";
    name?: string;
  } | null>(null);
  const [searchParamsData, setSearchParamsData] = useState<{
    new?: string;
    role?: "girlfriend" | "boyfriend";
    name?: string;
    emoji?: string;
  }>({});
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function loadData() {
      const { roomId: id } = await params;
      const searchParams_ = searchParams ? await searchParams : {};

      setRoomId(id);
      setSearchParamsData(searchParams_);

      // Load current user from localStorage
      const userData = localStorage.getItem("activeRoom");
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUser({
          role: user.role,
          name: user.name,
        });
      }

      const room = await getRoomData(id);
      setRoomData(room);
      setLoading(false);
    }

    loadData();
  }, [params, searchParams]);

  // Polling effect to check for partner joining
  useEffect(() => {
    if (!roomId) return;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    console.log("🔄 Starting polling for room:", roomId);

    const pollRoomStatus = async () => {
      console.log("📡 Polling room status...");
      try {
        const updatedRoom = await getRoomData(roomId);
        if (updatedRoom) {
          setRoomData(updatedRoom);

          // Check if room is now complete
          const nowComplete =
            updatedRoom.girlfriend_name && updatedRoom.boyfriend_name;

          if (nowComplete) {
            console.log("✅ Room complete, stopping polling");
            setIsPolling(false);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          } else {
            // Continue polling - ensure isPolling is true
            setIsPolling(true);
          }
        }
      } catch (error) {
        console.error("Error polling room status:", error);
      }
    };

    // Start polling immediately if room data suggests we should
    setIsPolling(true);

    // Initial poll
    pollRoomStatus();

    // Poll every 5 seconds
    intervalRef.current = setInterval(pollRoomStatus, 5000);

    return () => {
      console.log("🛑 Cleanup: Clearing polling interval");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsPolling(false);
    };
  }, [roomId]); // Only depend on roomId, let the polling logic handle the rest

  if (loading) {
    return (
      <GradientBackground className="flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Loading room...</p>
        </div>
      </GradientBackground>
    );
  }

  if (!roomData) {
    return (
      <GradientBackground className="flex items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-card/60 rounded-xl shadow-lg p-8">
            <div className="text-6xl mb-4">😔</div>
            <h1 className="text-2xl font-bold mb-4">Room Not Found</h1>
            <p className="text-primary/85 mb-6">
              This room doesn&apos;t exist or has expired. Rooms automatically
              expire after 2.5 hours for privacy.
            </p>
            <Link
              href="/room"
              className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
            >
              Create New Room
            </Link>
          </div>
        </div>
      </GradientBackground>
    );
  }

  const isGirlfriendMissing = !roomData.girlfriend_name;
  const isBoyfriendMissing = !roomData.boyfriend_name;
  const missingPartner = isGirlfriendMissing
    ? "girlfriend"
    : isBoyfriendMissing
    ? "boyfriend"
    : null;

  return (
    <GradientBackground className="py-12 px-4">
      {/* Save active room data if coming from new room creation/join */}
      {searchParamsData.new === "true" &&
        searchParamsData.role &&
        searchParamsData.name &&
        searchParamsData.emoji && (
          <ActiveRoomSaver
            roomId={roomId}
            role={searchParamsData.role}
            name={decodeURIComponent(searchParamsData.name)}
            emoji={decodeURIComponent(searchParamsData.emoji)}
          />
        )}

      {/* Trigger audio playback when landing on a new room */}
      <AudioTrigger shouldPlay={searchParamsData.new === "true"} />

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl mb-4 uppercase font-mono">Room {roomId}</h1>
          <div className="flex flex-col items-center justify-center gap-2">
            <p className="text-lg text-primary/85 font-mono">
              {missingPartner
                ? `Waiting for ${missingPartner} to join`
                : "Both partners are in the room!"}
            </p>
            {isPolling && (
              <div className="flex items-center gap-1 text-sm text-primary/60">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600"></div>
                <span className="text-xs">checking</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Girlfriend Card */}
          <div
            className={cn(
              "bg-card/60 rounded-xl shadow-lg p-6 border relative",
              "bg-amber-100/50 dark:bg-amber-900/25 backdrop-blur-sm",
              "border-amber-400 dark:border-amber-800"
            )}
          >
            {currentUser?.role === "girlfriend" && (
              <div className="absolute top-3 right-3">
                <span className="bg-purple-200 border border-purple-400 text-purple-800 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700 text-xs font-bold px-2 py-1 rounded-full">
                  You
                </span>
              </div>
            )}
            <div className="text-center">
              <div className="text-4xl mb-3">
                {roomData.girlfriend_emoji || "💕"}
              </div>
              <h2 className="text-xl font-semibold mb-2">Girlfriend</h2>
              {roomData.girlfriend_name ? (
                <div>
                  <p className="text-lg text-amber-600 font-medium mb-2">
                    {roomData.girlfriend_name}
                  </p>
                  <span className="inline-block bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 text-sm px-3 py-1 rounded-full">
                    ✅ Joined
                  </span>
                </div>
              ) : (
                <div>
                  <p className="text-primary/85 mb-2">Waiting to join...</p>
                  <span className="inline-block bg-yellow-100 text-yellow-800 text-sm px-3 py-1 rounded-full">
                    ⏳ Pending
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Boyfriend Card */}
          <div
            className={cn(
              "bg-card/60 rounded-xl shadow-lg p-6 border relative",
              "bg-blue-100/50 dark:bg-blue-900/25 backdrop-blur-sm",
              "border-blue-400 dark:border-blue-800"
            )}
          >
            {currentUser?.role === "boyfriend" && (
              <div className="absolute top-3 right-3">
                <span className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs font-bold px-2 py-1 rounded-full">
                  You
                </span>
              </div>
            )}
            <div className="text-center">
              <div className="text-4xl mb-3">
                {roomData.boyfriend_emoji || "💙"}
              </div>
              <h2 className="text-xl font-semibold mb-2">Boyfriend</h2>
              {roomData.boyfriend_name ? (
                <div>
                  <p className="text-lg text-blue-600 font-medium mb-2">
                    {roomData.boyfriend_name}
                  </p>
                  <span className="inline-block bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 text-sm px-3 py-1 rounded-full">
                    ✅ Joined
                  </span>
                </div>
              ) : (
                <div>
                  <p className="text-primary/85 mb-2">Waiting to join...</p>
                  <span className="inline-block bg-yellow-100 text-yellow-800 text-sm px-3 py-1 rounded-full">
                    ⏳ Pending
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {missingPartner && (
          <div className="bg-card/60 rounded-xl shadow-lg p-6 border mb-8">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">
                Share this Room ID with your partner
              </h3>
              <CopyRoomId roomId={roomId} />
              <p className="text-primary/85 text-sm">
                Your partner can join by visiting <strong>/join</strong> and
                entering this room ID
              </p>
            </div>
          </div>
        )}

        {!missingPartner && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-xl shadow-lg p-6 border border-green-200 dark:border-green-800 mb-8">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold mb-4 text-green-800 dark:text-green-200">
                Both Partners Joined!
              </h3>
              <p className="text-green-700 dark:text-green-300 mb-6">
                Awesome! You can now start uploading your personality images and
                discover how you see each other.
              </p>
              <Button variant="shadow" size="lg" asChild>
                <Link href={`/room/${roomId}/personality`}>
                  🎮 Start Personality Quiz
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Room Info */}
        <div className="bg-card/60 rounded-xl shadow-lg p-6 border">
          <h3 className="text-lg font-semibold mb-4">Room Information</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-primary/85">Room ID:</span>
              <span className="ml-2 font-mono">{roomData.room_id}</span>
            </div>
            <div>
              <span className="text-primary/85">Created:</span>
              <span className="ml-2">
                {new Date(roomData.created_at).toLocaleString("en-US", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
              </span>
            </div>
            <div>
              <span className="text-primary/85">Status:</span>
              <span className="ml-2">
                {missingPartner
                  ? "Waiting for partner"
                  : "Both partners joined"}
              </span>
            </div>
            <div>
              <span className="text-primary/85">Expires:</span>
              <span className="ml-2">
                {new Date(
                  new Date(roomData.created_at).getTime() + 2.5 * 60 * 60 * 1000
                ).toLocaleString("en-US", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-purple-600 hover:text-purple-700 font-medium dark:text-purple-400 dark:hover:text-purple-300"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </GradientBackground>
  );
}
