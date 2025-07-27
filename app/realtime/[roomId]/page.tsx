"use client";

import { useState, useEffect } from "react";
import RealtimeRoom from "@/components/realtime-room";
import Starfield from "@/components/starfield";
import GradientBackground from "@/components/gradient-background";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getRoomData } from "@/lib/actions";
import { sleep } from "@/lib/utils";
import { Room } from "@/lib/dynamodb";
import { Badge } from "@/components/ui/badge";
import { ActiveRoom } from "@/hooks/use-active-room";
import { useGameStore } from "@/stores/realtime-store";

export default function RealtimeRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const [starfieldEnabled, setStarfieldEnabled] = useState(true);
  const [roomData, setRoomData] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const router = useRouter();

  const initializeFromRoomData = useGameStore(
    (state) => state.initializeFromRoomData
  );

  useEffect(() => {
    async function loadAndValidate() {
      const { roomId } = await params;

      setLoading(true);
      await sleep(2000);
      setError(null);
      try {
        // Load room data
        const room: Room | null = await getRoomData(roomId);
        console.log("Loaded room data:", room);

        if (!room) {
          setError("Room not found or has expired");
          setLoading(false);
          return;
        }

        // Check if both partners have joined
        if (!room.a_name || !room.b_name) {
          setError(
            "Both partners must join the room before starting the realtime experience"
          );
          setLoading(false);
          return;
        }
        // Check if current user is in this room
        const userData = localStorage.getItem("activeRoom");

        if (!userData) {
          setError("You must join the room first");
          setLoading(false);
          return;
        }

        const user: ActiveRoom = JSON.parse(userData);

        if (user?.room_id !== roomId) {
          setError("You are not a member of this room");
          setLoading(false);
          return;
        }

        // Validate user slot matches room data
        const isValidUser =
          (user.slot === "a" && room.a_name === user.name) ||
          (user.slot === "b" && room.b_name === user.name);

        if (!isValidUser) {
          setError("Invalid user credentials for this room");
          setLoading(false);
          return;
        }

        setRoomData(room);
        initializeFromRoomData(room, user.slot);
        setLoading(false);
      } catch (e) {
        console.error("Error loading room data:", e);
        setError("Failed to load room data");
        setLoading(false);
      }
    }
    loadAndValidate();
  }, [params, initializeFromRoomData]);

  if (loading) {
    return (
      <GradientBackground className="flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Loading realtime experience...</p>
        </div>
      </GradientBackground>
    );
  }

  // console.log("activeRoom", activeRoom);
  // console.log("roomData", roomData);
  // console.log("error", error);
  if (error || !roomData) {
    return (
      <GradientBackground className="flex items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-card/60 rounded-xl shadow-lg p-8 border">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-primary/85 mb-6">
              {error || "You don't have permission to access this page."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={`/`}>
                <Button variant="default">Back to Home</Button>
              </Link>
              <Link href="/join">
                <Button variant="outline">Join Room</Button>
              </Link>
            </div>
          </div>
        </div>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground className="relative flex flex-col items-center px-2 sm:px-8 py-12 min-h-screen">
      {starfieldEnabled && <Starfield />}
      <div className="relative z-10 w-full max-w-5xl">
        <header className="flex font-mono items-center justify-start mb-6">
          <h1 className="text-2xl text-gradient font-bold px-4">
            Realtime Room Experience{" "}
          </h1>
          <Badge variant="secondary" className="">
            {roomData.room_id}
          </Badge>
        </header>
        <RealtimeRoom
          roomId={roomData.room_id}
          starfieldEnabled={starfieldEnabled}
          onToggleStarfield={() => setStarfieldEnabled((v) => !v)}
        />
      </div>
    </GradientBackground>
  );
}
