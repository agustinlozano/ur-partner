"use client";

import { useState, useEffect } from "react";
import { getRoomData } from "@/lib/actions";
import PersonalityForm from "@/components/personality-form";
import GradientBackground from "@/components/gradient-background";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface PageProps {
  params: Promise<{ roomId: string }>;
}

interface RoomData {
  room_id: string;
  created_at: string;
  a_name?: string;
  a_emoji?: string;
  b_name?: string;
  b_emoji?: string;
}

export default function PersonalityPage({ params }: PageProps) {
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [roomId, setRoomId] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadAndValidate() {
      try {
        const { roomId: id } = await params;
        setRoomId(id);

        // Load room data
        const room = await getRoomData(id);
        if (!room) {
          setError("Room not found or has expired");
          setLoading(false);
          return;
        }

        // Check if both partners have joined
        if (!room.a_name || !room.b_name) {
          setError(
            "Both partners must join the room before starting the personality quiz"
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

        const user = JSON.parse(userData);
        if (user.room_id !== id) {
          setError("You are not a member of this room");
          setLoading(false);
          return;
        }

        // Validate user role matches room data
        const isValidUser =
          (user.role === "girlfriend" && room.a_name === user.name) ||
          (user.role === "boyfriend" && room.b_name === user.name);

        if (!isValidUser) {
          setError("Invalid user credentials for this room");
          setLoading(false);
          return;
        }

        setRoomData(room);
        setCurrentUser(user);
        setLoading(false);
      } catch (error) {
        console.error("Error loading room:", error);
        setError("Failed to load room data");
        setLoading(false);
      }
    }

    loadAndValidate();
  }, [params]);

  if (loading) {
    return (
      <GradientBackground className="flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Loading personality quiz...</p>
        </div>
      </GradientBackground>
    );
  }

  if (error || !roomData || !currentUser) {
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
              <Link href={`/room/${roomId}`}>
                <Button variant="default">Back to Room</Button>
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
    <PersonalityForm
      roomId={roomId}
      onBack={() => router.push(`/room/${roomId}`)}
    />
  );
}
