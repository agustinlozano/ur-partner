"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import GradientBackground from "@/components/gradient-background";
import ActiveRoomSaver from "@/components/active-room-saver";
import CopyRoomId from "@/components/copy-room-id";
import RelativeTime from "@/components/ui/relative-time";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UnsplashIcon } from "@/components/icons";

import { checkRevealReadyEnhanced } from "@/lib/check-reveal-ready";
import { RelationshipRole } from "@/lib/role-utils";
import { getRoomData } from "@/lib/actions";
import { Room } from "@/lib/dynamodb";
import { sleep } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ roomId: string }>;
  searchParams?: Promise<{
    new?: string;
    role?: RelationshipRole;
    slot?: "a" | "b";
    name?: string;
    emoji?: string;
  }>;
}

interface RoomData {
  room_id: string;
  created_at: string;
  a_name?: string;
  a_emoji?: string;
  a_role?: string;
  b_name?: string;
  b_emoji?: string;
  b_role?: string;
}

export default function RoomDetailPage({ params, searchParams }: PageProps) {
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [roomId, setRoomId] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<{
    role?: RelationshipRole;
    name?: string;
    slot?: string;
  } | null>(null);
  const [searchParamsData, setSearchParamsData] = useState<{
    new?: string;
    role?: RelationshipRole;
    slot?: "a" | "b";
    name?: string;
    emoji?: string;
  }>({});
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [revealReady, setRevealReady] = useState<{
    isReady: boolean;
    partnerRole: string;
    totalImages: number;
    categoriesCompleted: number;
    categoriesWithProgress: number;
  } | null>(null);
  const [checkingReveal, setCheckingReveal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      const { roomId: id } = await params;
      const searchParams_ = searchParams ? await searchParams : {};

      setRoomId(id);
      setSearchParamsData(searchParams_);

      const room = await getRoomData(id);

      if (!room) {
        router.push("/");
        return;
      }

      // Load current user from localStorage
      const userData = localStorage.getItem("activeRoom");

      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUser({
          role: user.role,
          name: user.name,
          slot: (user.slot || "").toLowerCase(),
        });
      } else {
        const slot = searchParams_.slot;

        if (!slot) {
          router.push("/");
          return;
        }

        // slot must be "a" or "b" check this out before contitue
        if (slot !== "a" && slot !== "b") {
          router.push("/");
          return;
        }

        // find user from room data by slot
        const name = room[`${slot}_name` as keyof Room];
        const role = room[`${slot}_role` as keyof Room];

        setCurrentUser({
          role: role as RelationshipRole,
          name: name as string,
          slot: slot,
        });
      }

      setRoomData(room);
      setLoading(false);
    }

    loadData();
  }, [params, searchParams, router]); // added router to dependencies (problem?)

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
          const nowComplete = updatedRoom.a_name && updatedRoom.b_name;

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
    intervalRef.current = setInterval(pollRoomStatus, 8000);

    return () => {
      console.log("🛑 Cleanup: Clearing polling interval");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsPolling(false);
    };
  }, [roomId]); // Only depend on roomId, let the polling logic handle the rest

  // Check if reveal is ready when both partners are present
  useEffect(() => {
    async function checkReveal() {
      await sleep(2000);
      const isSlotAMissing = !roomData?.a_name;
      const isSlotBMissing = !roomData?.b_name;
      const hasMissingPartner = isSlotAMissing || isSlotBMissing;

      if (!roomData || !currentUser?.slot || hasMissingPartner) {
        console.log("No room data or user slot or missing partner");
        setRevealReady(null);
        return;
      }

      setCheckingReveal(true);
      try {
        const result = await checkRevealReadyEnhanced(roomId, currentUser.slot);
        if (!result.error) {
          setRevealReady({
            isReady: result.isReady,
            partnerRole: result.partnerRole,
            totalImages: result.totalImages,
            categoriesCompleted: result.categoriesCompleted,
            categoriesWithProgress:
              result.categoriesWithProgress || result.categoriesCompleted,
          });
        } else {
          setRevealReady(null);
        }
      } catch (error) {
        console.error("Error checking reveal:", error);
        setRevealReady(null);
      } finally {
        setCheckingReveal(false);
      }
    }

    // Only check if both partners are present
    if (roomData && currentUser?.slot) {
      checkReveal();
    }
  }, [roomData, currentUser?.slot, roomId]);

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

  const isSlotAMissing = !roomData.a_name;
  const isSlotBMissing = !roomData.b_name;
  const missingPartner = isSlotAMissing || isSlotBMissing;

  return (
    <GradientBackground className="py-12 px-4">
      {/* Save active room data if coming from new room creation/join */}
      {searchParamsData.new === "true" &&
        searchParamsData.role &&
        searchParamsData.slot &&
        searchParamsData.name &&
        searchParamsData.emoji && (
          <ActiveRoomSaver
            roomId={roomId}
            role={searchParamsData.role}
            slot={searchParamsData.slot}
            name={decodeURIComponent(searchParamsData.name)}
            emoji={decodeURIComponent(searchParamsData.emoji)}
          />
        )}

      {/* Trigger audio playback when landing on a new room */}
      {/* <AudioTrigger shouldPlay={searchParamsData.new === "true"} /> */}

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl mb-4 uppercase font-mono">Room {roomId}</h1>
          <div className="flex flex-col items-center justify-center gap-2">
            <p className="text-lg text-primary/85 font-mono">
              {missingPartner
                ? `Waiting for your partner to join`
                : "Both partners are in the room!"}
            </p>

            <div className="min-h-[24px]">
              {isPolling && (
                <div className="flex items-center gap-1 text-sm text-primary/60">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600"></div>
                  <span className="text-xs">checking</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Slot A Card */}
          <div
            data-testid="slot-a-card"
            className={cn(
              "bg-card/60 rounded-xl shadow-lg p-6 border relative select-none",
              "bg-amber-100/50 dark:bg-amber-900/25 backdrop-blur-sm",
              "border-amber-400 dark:border-amber-800"
            )}
          >
            {currentUser?.slot === "a" && (
              <div className="absolute top-3 right-3">
                <span className="bg-purple-200 border border-purple-400 text-purple-800 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700 text-xs font-bold px-2 py-1 rounded-full">
                  You
                </span>
              </div>
            )}
            <div className="text-center">
              <div className="text-4xl mb-3">{roomData.a_emoji || "💕"}</div>
              <h2 className="text-xl font-semibold mb-2 capitalize">
                {roomData.a_role || "Partner A"}
              </h2>
              {roomData.a_name ? (
                <div>
                  <p className="text-lg text-amber-600 font-medium mb-2">
                    {roomData.a_name}
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

          {/* Slot B Card */}
          <div
            data-testid="slot-b-card"
            className={cn(
              "bg-card/60 rounded-xl shadow-lg p-6 border relative select-none",
              "bg-blue-100/50 dark:bg-blue-900/25 backdrop-blur-sm",
              "border-blue-400 dark:border-blue-800"
            )}
          >
            {currentUser?.slot === "b" && (
              <div className="absolute top-3 right-3">
                <span className="bg-purple-200 border border-purple-400 text-purple-800 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700 text-xs font-bold px-2 py-1 rounded-full">
                  You
                </span>
              </div>
            )}
            <div className="text-center">
              <div className="text-4xl mb-3">{roomData.b_emoji || "💙"}</div>
              <h2 className="text-xl font-semibold mb-2 capitalize">
                {roomData.b_role || "Partner B"}
              </h2>
              {roomData.b_name ? (
                <div>
                  <p className="text-lg text-blue-600 font-medium mb-2">
                    {roomData.b_name}
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
          <div
            data-testid="share-room-id"
            className="bg-card/60 rounded-xl shadow-lg p-6 border mb-8"
          >
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
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-xl shadow-lg p-6 border border-green-200 dark:border-green-800 mb-8 select-none">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold mb-4 text-green-800 dark:text-green-200">
                Both Partners Joined!
              </h3>
              <p className="text-green-700 dark:text-green-300 mb-6">
                Awesome! You can now start uploading your personality images and
                discover how you see each other.
              </p>

              <div className="flex flex-col gap-3 justify-center items-center">
                <Button variant="shadow" size="lg" asChild>
                  <Link href={`/room/${roomId}/personality`}>
                    🎮 Start Personality Quiz
                  </Link>
                </Button>

                {/* Reveal Section - Always reserve space to prevent layout shift */}
                <div className="min-h-[64px] flex flex-col justify-center items-center">
                  {revealReady?.isReady && (
                    <Button
                      variant="outline"
                      size="lg"
                      asChild
                      className="border-purple-500 text-purple-700 hover:bg-purple-50 dark:text-purple-300 dark:hover:bg-purple-950"
                    >
                      <Link href={`/room/${roomId}/view-reveal`}>
                        ✨ View Personality Reveal
                      </Link>
                    </Button>
                  )}

                  {revealReady && !revealReady.isReady && (
                    <div className="text-center">
                      <p className="text-sm text-green-600 dark:text-green-400 mb-2">
                        Reveal available when both complete the quiz
                      </p>

                      {/* Enhanced temporal progress display */}
                      <div className="space-y-1">
                        {/* Show the temporal progression */}
                        {revealReady.categoriesWithProgress >
                        revealReady.categoriesCompleted ? (
                          /* Partner has pre-loaded images but hasn't uploaded all yet */
                          <div className="space-y-1">
                            <p className="text-xs text-blue-500 dark:text-blue-400">
                              Partner working on{" "}
                              {revealReady.categoriesWithProgress}/9 categories
                            </p>
                            <p className="text-xs text-green-500 dark:text-green-500">
                              {revealReady.categoriesCompleted}/9 categories
                              uploaded
                            </p>
                            {revealReady.totalImages > 0 && (
                              <p className="text-xs text-purple-500 dark:text-purple-400">
                                {revealReady.totalImages} images ready
                              </p>
                            )}
                          </div>
                        ) : (
                          /* Partner has equal progress (all uploaded) or hasn't started much */
                          <div className="space-y-1">
                            <p className="text-xs text-green-500 dark:text-green-500">
                              Partner has {revealReady.categoriesCompleted}/9
                              categories ready
                            </p>
                            {revealReady.totalImages > 0 && (
                              <p className="text-xs text-purple-500 dark:text-purple-400">
                                {revealReady.totalImages} images uploaded
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Show loading state when checking reveal */}
                  {/* {checkingReveal && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600"></div>
                        <span>Checking partner progress...</span>
                      </div>
                    </div>
                  )} */}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/75 dark:to-purple-950 rounded-xl shadow-lg p-6 border border-purple-300 dark:border-purple-600 mb-8">
          <div className="text-center flex flex-col items-center gap-3">
            <div className="text-6xl mb-4">⚡️</div>
            <h3 className="text-xl font-semibold mb-4 text-purple-500 dark:text-purple-300">
              Realtime Experience{" "}
              <Badge className="ml-2 border-purple-400 bg-purple-200 text-purple-500 dark:text-purple-50 dark:bg-purple-950 select-none">
                BETA
              </Badge>
            </h3>
            <div className="text-sm text-purple-800 dark:text-purple-200 font-mono max-w-xl mx-auto mb-2">
              Dive into the <span className="font-bold">live</span> playground
              where every move is synced instantly.
              <br />
              <span className="text-purple-500">
                Chat, upload, drag, and vibe
              </span>{" "}
              with your partner in real time.
              <br />
              <span className="block">💜</span>
            </div>
            <Button
              variant="shadow"
              size="lg"
              asChild
              className="border-purple-900 hover:bg-purple-50 dark:text-purple-300 dark:hover:bg-purple-950 select-none"
            >
              <Link href={`/realtime/${roomId}`}>
                🎮 Enter Realtime Experience
              </Link>
            </Button>
            {/* Unsplash attribution */}
            <div className="mt-3 text-xs text-primary/80 dark:text-primary/60 flex items-center gap-2">
              <UnsplashIcon className="h-4 w-4" />
              <span>Powered by Unsplash</span>
            </div>
          </div>
        </div>

        {/* Room Info */}
        <div className="bg-card/60 rounded-xl shadow-lg p-6 border">
          <h3 className="text-lg font-semibold mb-4">Room Information</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-primary/85">Room ID</span>
              <span className="ml-2 font-mono">{roomData.room_id}</span>
            </div>
            <div>
              <span className="text-primary/85">Created</span>
              <span className="ml-2">
                <RelativeTime
                  datetime={roomData.created_at}
                  format="relative"
                  className="font-medium"
                />
              </span>
            </div>
            <div>
              <span className="text-primary/85">Status</span>
              <span className="ml-2">
                {missingPartner
                  ? "Waiting for partner"
                  : "Both partners joined"}
              </span>
            </div>
            <div>
              <span className="text-primary/85">Expires</span>
              <span className="ml-2">
                <RelativeTime
                  datetime={new Date(
                    new Date(roomData.created_at).getTime() +
                      2.5 * 60 * 60 * 1000
                  ).toISOString()}
                  format="relative"
                  tense="future"
                  className="font-medium text-orange-600"
                />
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-purple-600 hover:text-purple-700 font-medium dark:text-purple-400 dark:hover:text-purple-300 select-none"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </GradientBackground>
  );
}
