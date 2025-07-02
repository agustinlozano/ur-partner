"use client";

import {
  useState,
  useEffect,
  useRef,
  useActionState,
  useTransition,
} from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { joinRoomAndRedirect } from "@/lib/actions";
import { Button } from "./ui/button";
import EmojiSelector from "./emoji-selector";
import { useActiveRoom } from "@/hooks/use-active-room";
import { capitalize } from "@/lib/utils";
import { type RelationshipRole } from "@/lib/role-utils";

// Componente moderno para el botón usando useFormStatus
function SubmitButton({
  roomInfo,
  selectedRole,
  selectedEmoji,
  disabled,
}: {
  roomInfo: any;
  selectedRole: RelationshipRole | null;
  selectedEmoji: string;
  disabled: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="shadow"
      disabled={
        pending || !roomInfo || !selectedRole || !selectedEmoji || disabled
      }
      className="w-full"
    >
      {pending ? (
        <div className="flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          Joining Room...
        </div>
      ) : !roomInfo ? (
        "Enter Room ID"
      ) : !selectedRole ? (
        "Choose Your Role"
      ) : !selectedEmoji ? (
        "Choose Your Avatar"
      ) : (
        `Join as ${selectedRole} 💫`
      )}
    </Button>
  );
}

interface JoinRoomProps {
  initialRoomId?: string;
}

export default function JoinRoom({ initialRoomId }: JoinRoomProps) {
  const router = useRouter();
  const { activeRoom } = useActiveRoom();
  const [isPending, startTransition] = useTransition();

  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [checkingRoom, setCheckingRoom] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<RelationshipRole | null>(
    null
  );
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const roomIdInputRef = useRef<HTMLInputElement>(null);

  // Action moderna con useActionState
  const [state, formAction] = useActionState(
    async (prevState: any, formData: FormData) => {
      try {
        const name = formData.get("name") as string;
        const capitalizedName = capitalize(name);
        formData.set("name", capitalizedName);

        const result = await joinRoomAndRedirect(formData);

        if (result.success && result.redirectUrl) {
          startTransition(() => {
            router.push(result.redirectUrl);
          });
          return { success: true, error: null };
        } else {
          return {
            success: false,
            error: result.error || "Failed to join room",
          };
        }
      } catch (err) {
        console.error("Error joining room:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Unknown error occurred",
        };
      }
    },
    { success: false, error: null }
  );

  // Pre-complete room ID if provided and check it automatically
  useEffect(() => {
    if (initialRoomId && roomIdInputRef.current) {
      const formattedRoomId = initialRoomId.toUpperCase();
      roomIdInputRef.current.value = formattedRoomId;
      checkRoom(formattedRoomId);
    }
  }, [initialRoomId]);

  const [checkRoomError, setCheckRoomError] = useState<string | null>(null);

  const checkRoom = async (roomId: string) => {
    if (!roomId.trim()) {
      setRoomInfo(null);
      setCheckRoomError(null);
      setSelectedEmoji(""); // Reset emoji when room changes
      setSelectedRole(null); // Reset role when room changes
      return;
    }

    // Check if trying to join the same room that's already active
    if (
      activeRoom &&
      roomId.toUpperCase() === activeRoom.room_id.toUpperCase()
    ) {
      setRoomInfo(null);
      setCheckRoomError(
        "You are already in this room! Go to your active room instead."
      );
      setSelectedEmoji("");
      setSelectedRole(null);
      return;
    }

    setCheckingRoom(true);
    setCheckRoomError(null);
    try {
      const response = await fetch(`/api/room-info/${roomId}`);
      const data = await response.json();

      if (data.success) {
        setRoomInfo(data.room);
        setCheckRoomError(null);
        setSelectedEmoji(""); // Reset emoji when new room is found
        setSelectedRole(null); // Reset role when new room is found
      } else {
        setRoomInfo(null);
        setCheckRoomError(data.error);
        setSelectedEmoji("");
        setSelectedRole(null);
      }
    } catch (err) {
      setRoomInfo(null);
      setCheckRoomError("Failed to check room");
      setSelectedEmoji("");
      setSelectedRole(null);
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

  const handleRoleChange = (role: RelationshipRole) => {
    setSelectedRole(role);
    setSelectedEmoji(""); // Reset emoji when role changes
  };

  // Check if room has available slots
  const hasAvailableSlots = roomInfo
    ? !roomInfo.a_name || !roomInfo.b_name
    : false;

  // If there's an active room, show it prominently
  if (activeRoom) {
    return (
      <div className="max-w-md mx-auto p-6 bg-card/60 rounded-xl shadow-lg border">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold font-mono">Active Room Found</h2>
          <p className="text-primary/85 mt-2">
            You already have an active room in progress
          </p>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4 dark:bg-blue-950 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <div className="text-blue-500 text-xl">🎯</div>
            <div>
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Current Room Details
              </h3>
              <div className="mt-2 space-y-1 text-sm text-blue-700 dark:text-blue-300">
                <p>
                  <strong>Room ID:</strong> {activeRoom.room_id}
                </p>
                <p>
                  <strong>Your Role:</strong>{" "}
                  <span className="capitalize">{activeRoom.role}</span>
                </p>
                <p>
                  <strong>Your Name:</strong> {activeRoom.name}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span>{activeRoom.emoji}</span>
                  <span>Your Avatar</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <Button
            onClick={() => router.push(`/room/${activeRoom.room_id}`)}
            variant="shadow"
            className="w-full"
          >
            Go to Active Room
          </Button>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-950 dark:border-amber-800">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-amber-500">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                Want to Join a Different Room?
              </h3>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                You can only be in one room at a time. If you want to join a
                different room, you&apos;ll need to leave your current room
                first from the room page.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Validación de nombre
  function validateName(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return "Name is required";
    if (trimmed.length < 2 || trimmed.length > 24)
      return "Name must be 2-24 characters";
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü'\- ]+$/.test(trimmed))
      return "Only letters, spaces, hyphens, apostrophes and accents allowed";
    if (/^(.)\1{1,}$/.test(trimmed.replace(/ /g, "")))
      return "Name cannot be a single repeated character";
    return null;
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    setNameError(validateName(value));
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-card/60 rounded-xl shadow-lg border">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Join a Room</h1>
        <p className="text-primary/85 mt-2">
          Enter the room ID shared by your partner
        </p>
      </div>

      {(state.error || checkRoomError) && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-950 dark:border-red-800">
          <p className="text-red-700 text-sm dark:text-red-300">
            {state.error || checkRoomError}
          </p>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <label
            htmlFor="roomId"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Room ID
          </label>
          <input
            ref={roomIdInputRef}
            type="text"
            id="roomId"
            name="roomId"
            required
            disabled={isPending}
            onChange={handleRoomIdChange}
            className="w-full px-3 py-2 border bg-primary/5 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:cursor-not-allowed font-mono text-center text-lg tracking-wider"
            placeholder="Enter Room ID"
            maxLength={8}
            style={{ textTransform: "uppercase" }}
          />

          <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 h-6">
            {checkingRoom && (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-500"></div>
                <span>Checking room...</span>
              </>
            )}
          </div>
        </div>

        {roomInfo && !hasAvailableSlots && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-950 dark:border-red-800">
            <div className="flex items-start gap-3">
              <div className="text-red-500 text-xl">❌</div>
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                  Room is Full
                </h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  This room already has both partners. You cannot join this
                  room.
                </p>
              </div>
            </div>
          </div>
        )}

        {roomInfo && hasAvailableSlots && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950 dark:border-green-800">
            <div className="flex items-start gap-3">
              <div className="text-green-500 text-xl">✅</div>
              <div>
                <h3 className="text-sm font-medium text-green-800 dark:text-green-400">
                  Room Found!
                </h3>
                <div className="mt-1 text-sm text-green-700 dark:text-green-300">
                  <p>
                    <strong>Participants:</strong>
                  </p>
                  <div className="flex flex-col gap-2 mt-1">
                    {roomInfo.a_name && (
                      <div className="flex items-center gap-2">
                        <span>{roomInfo.a_emoji || "💕"}</span>
                        <span>{roomInfo.a_name}</span>
                        <span className="text-xs text-green-600 dark:text-green-400">
                          (Slot A)
                        </span>
                      </div>
                    )}
                    {roomInfo.b_name && (
                      <div className="flex items-center gap-2">
                        <span>{roomInfo.b_emoji || "💙"}</span>
                        <span>{roomInfo.b_name}</span>
                        <span className="text-xs text-green-600 dark:text-green-400">
                          (Slot B)
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 p-2 bg-blue-100 rounded border border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                    <p className="text-blue-800 text-xs dark:text-blue-300">
                      Available slots:{" "}
                      {!roomInfo.a_name && !roomInfo.b_name
                        ? "A, B"
                        : !roomInfo.a_name
                        ? "A"
                        : "B"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {roomInfo && hasAvailableSlots && (
          <>
            <div>
              <label className="block text-sm font-medium text-primary/60 mb-3">
                Your Role in this Relationship
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    "girlfriend",
                    "boyfriend",
                    "friend",
                    "roommate",
                    "workmate",
                    "gym bro",
                    "sister",
                    "gym girl",
                  ] as RelationshipRole[]
                ).map((role) => (
                  <label key={role} className="flex items-center">
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      required
                      disabled={isPending}
                      checked={selectedRole === role}
                      onChange={() => handleRoleChange(role)}
                      className="size-4 text-purple-600 focus:ring-purple-500 disabled:cursor-not-allowed"
                    />
                    <span className="ml-2 text-sm capitalize">{role}</span>
                  </label>
                ))}
              </div>
            </div>

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
                disabled={isPending}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:cursor-not-allowed"
                placeholder="Enter your name"
                autoComplete="off"
                spellCheck={false}
                value={name}
                onChange={handleNameChange}
                maxLength={24}
              />
              <div className="mt-1 h-2 flex items-start">
                {nameError && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {nameError}
                  </p>
                )}
              </div>
            </div>

            {selectedRole && (
              <EmojiSelector
                selectedEmoji={selectedEmoji}
                onEmojiSelect={setSelectedEmoji}
                name="emoji"
                disabled={isPending}
              />
            )}
          </>
        )}

        <SubmitButton
          roomInfo={roomInfo}
          selectedRole={selectedRole}
          selectedEmoji={selectedEmoji}
          disabled={!!nameError || !name.trim() || !hasAvailableSlots}
        />
      </form>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-blue-500">ℹ️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-400">
              How to Join
            </h3>
            <div className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              <ul className="list-disc list-inside space-y-1">
                <li>Ask your partner for their Room ID</li>
                <li>Enter the 8-character Room ID above</li>
                <li>Choose your role in the relationship</li>
                <li>Pick your avatar and enter your name</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
