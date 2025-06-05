"use client";

import { useState, useActionState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { createRoomAndRedirect } from "@/lib/actions";
import { Button } from "./ui/button";
import { capitalize } from "@/lib/utils";
import EmojiSelector from "./emoji-selector";
import { useActiveRoom } from "@/hooks/use-active-room";

// Componente moderno para el botón usando useFormStatus
function SubmitButton({
  selectedRole,
  selectedEmoji,
}: {
  selectedRole: "girlfriend" | "boyfriend" | null;
  selectedEmoji: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="shadow"
      disabled={pending || !selectedRole || !selectedEmoji}
      className="w-full"
    >
      {pending ? (
        <div className="flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          Creating Room...
        </div>
      ) : !selectedRole ? (
        "Select Your Role"
      ) : !selectedEmoji ? (
        "Choose Your Avatar"
      ) : (
        "Create Room"
      )}
    </Button>
  );
}

export default function CreateRoom() {
  const router = useRouter();
  const { activeRoom, clearActive } = useActiveRoom();
  const [isPending, startTransition] = useTransition();

  const [selectedRole, setSelectedRole] = useState<
    "girlfriend" | "boyfriend" | null
  >(null);
  const [selectedEmoji, setSelectedEmoji] = useState<string>("");

  // Action moderna con useActionState
  const [state, formAction] = useActionState(
    async (prevState: any, formData: FormData) => {
      try {
        const name = formData.get("name") as string;
        const capitalizedName = capitalize(name);
        formData.set("name", capitalizedName);

        const result = await createRoomAndRedirect(formData);

        if (result.success && result.redirectUrl) {
          startTransition(() => {
            router.push(result.redirectUrl);
          });
          return { success: true, error: null };
        } else {
          return {
            success: false,
            error: result.error || "Failed to create room",
          };
        }
      } catch (err) {
        console.error("Error creating room:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Unknown error occurred",
        };
      }
    },
    { success: false, error: null }
  );

  const handleRoleChange = (role: "girlfriend" | "boyfriend") => {
    setSelectedRole(role);
    setSelectedEmoji(""); // Reset emoji when role changes
  };

  // If there's an active room, show it instead of the create form
  if (activeRoom) {
    return (
      <div className="max-w-md mx-auto p-6 bg-card rounded-xl shadow-lg border">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Active Room Found</h1>
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
                  {activeRoom.role === "girlfriend"
                    ? "Girlfriend"
                    : "Boyfriend"}
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

        <div className="space-y-3">
          <Button
            onClick={() => router.push(`/room/${activeRoom.room_id}`)}
            variant="shadow"
            className="w-full"
          >
            Go to Active Room
          </Button>

          <Button
            onClick={() => {
              clearActive();
              window.location.reload(); // Refresh to show create form
            }}
            variant="outline"
            className="w-full"
          >
            Leave Current Room & Create New
          </Button>
        </div>

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-950 dark:border-amber-800">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-amber-300">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                Note
              </h3>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                Creating a new room will abandon your current room. Make sure
                your partner knows before proceeding.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-card/60 rounded-xl shadow-lg border">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Create a Room</h1>
        <p className="text-primary/85 mt-2">
          Start your personality sharing journey with your partner
        </p>
      </div>

      {state.error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-950 dark:border-red-800">
          <p className="text-red-700 text-sm dark:text-red-300">
            {state.error}
          </p>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-primary/60 mb-2"
          >
            Your Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            disabled={isPending}
            className="w-full px-3 py-2 border bg-primary/5 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Enter your name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary/60 mb-3">
            Your Role in the Relationship
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="role"
                value="girlfriend"
                required
                disabled={isPending}
                onChange={() => handleRoleChange("girlfriend")}
                className="h-4 w-4 text-pink-600 focus:ring-pink-500 disabled:cursor-not-allowed"
              />
              <span className="ml-2 text-sm text-primary/60">
                Girlfriend 💛
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="role"
                value="boyfriend"
                required
                disabled={isPending}
                onChange={() => handleRoleChange("boyfriend")}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
              />
              <span className="ml-2 text-sm text-primary/60">Boyfriend 🩶</span>
            </label>
          </div>
        </div>

        {selectedRole && (
          <EmojiSelector
            role={selectedRole}
            selectedEmoji={selectedEmoji}
            onEmojiSelect={setSelectedEmoji}
            name="emoji"
            disabled={isPending}
          />
        )}

        <SubmitButton
          selectedRole={selectedRole}
          selectedEmoji={selectedEmoji}
        />
      </form>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-blue-500">ℹ️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Room Information
            </h3>
            <div className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              <ul className="list-disc list-inside space-y-1">
                <li>Rooms expire after 2.5 hours</li>
                <li>Share the room ID with your partner</li>
                <li>Both partners upload 9 personality images</li>
                <li>Images are revealed when both are ready</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
