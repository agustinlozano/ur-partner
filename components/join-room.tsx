"use client";

import { useState } from "react";
import { joinRoomAndRedirect } from "@/lib/actions";
import { Button } from "./ui/button";

export default function JoinRoom() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [checkingRoom, setCheckingRoom] = useState(false);

  const checkRoom = async (roomId: string) => {
    if (!roomId.trim()) {
      setRoomInfo(null);
      return;
    }

    setCheckingRoom(true);
    try {
      const response = await fetch(`/api/room-info/${roomId}`);
      const data = await response.json();

      if (data.success) {
        setRoomInfo(data.room);
        setError(null);
      } else {
        setRoomInfo(null);
        setError(data.error);
      }
    } catch (err) {
      setRoomInfo(null);
      setError("Failed to check room");
    } finally {
      setCheckingRoom(false);
    }
  };

  const handleRoomIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const roomId = e.target.value.toUpperCase();
    e.target.value = roomId;

    // Check room after a short delay
    const timer = setTimeout(() => {
      checkRoom(roomId);
    }, 500);

    return () => clearTimeout(timer);
  };

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await joinRoomAndRedirect(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setIsLoading(false);
    }
  };

  const missingRole = roomInfo
    ? !roomInfo.girlfriend_name
      ? "girlfriend"
      : !roomInfo.boyfriend_name
      ? "boyfriend"
      : null
    : null;

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Join a Room</h1>
        <p className="text-gray-600 mt-2">
          Enter the room ID shared by your partner
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="roomId"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Room ID
          </label>
          <input
            type="text"
            id="roomId"
            name="roomId"
            required
            disabled={isLoading}
            onChange={handleRoomIdChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed font-mono text-center text-lg tracking-wider"
            placeholder="Enter Room ID"
            maxLength={8}
            style={{ textTransform: "uppercase" }}
          />

          {checkingRoom && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-500"></div>
              <span>Checking room...</span>
            </div>
          )}
        </div>

        {roomInfo && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="text-green-500 text-lg">✅</div>
              <div>
                <h3 className="text-sm font-medium text-green-800">
                  Room Found!
                </h3>
                <div className="mt-1 text-sm text-green-700">
                  <p>
                    <strong>Participants:</strong>
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="flex items-center gap-2">
                      <span>💕</span>
                      <span>{roomInfo.girlfriend_name || "Waiting..."}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>💙</span>
                      <span>{roomInfo.boyfriend_name || "Waiting..."}</span>
                    </div>
                  </div>
                  {missingRole && (
                    <div className="mt-2 p-2 bg-blue-100 rounded">
                      <p className="text-blue-800 text-xs">
                        <strong>You will join as:</strong>{" "}
                        {missingRole === "girlfriend"
                          ? "Girlfriend 💕"
                          : "Boyfriend 💙"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {roomInfo && missingRole && (
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Your Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Enter your name"
            />
          </div>
        )}

        <Button
          type="submit"
          variant="shadow"
          disabled={isLoading || !roomInfo || !missingRole}
          className="w-full"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Joining Room...
            </div>
          ) : !roomInfo ? (
            "Enter Room ID"
          ) : !missingRole ? (
            "Room is Full"
          ) : (
            `Join as ${
              missingRole === "girlfriend" ? "Girlfriend" : "Boyfriend"
            } 💫`
          )}
        </Button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-blue-500">ℹ️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">How to Join</h3>
            <div className="mt-1 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Ask your partner for their Room ID</li>
                <li>Enter the 8-character Room ID above</li>
                <li>We'll automatically assign your role</li>
                <li>Enter your name and join the room</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
