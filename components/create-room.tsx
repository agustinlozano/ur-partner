"use client";

import {
  useState,
  useActionState,
  useTransition,
  useRef,
  useEffect,
} from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { createRoomAndRedirect } from "@/lib/actions";
import { Button } from "./ui/button";
import { capitalize } from "@/lib/utils";
import EmojiSelector, { type EmojiSelectorRef } from "./emoji-selector";
import { useActiveRoom } from "@/hooks/use-active-room";
import { type RelationshipRole } from "@/lib/role-utils";

// Componente moderno para el botón usando useFormStatus
function SubmitButton({
  selectedRole,
  selectedEmoji,
  disabled,
  submitButtonRef,
}: {
  selectedRole: RelationshipRole | null;
  selectedEmoji: string;
  disabled: boolean;
  submitButtonRef?: React.RefObject<HTMLButtonElement | null>;
}) {
  const { pending } = useFormStatus();

  // Determinar si el botón está listo para submit
  const isReadyForSubmit =
    selectedRole && selectedEmoji && !disabled && !pending;

  return (
    <Button
      ref={submitButtonRef}
      type="submit"
      variant="shadow"
      disabled={pending || disabled}
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
        <span className={isReadyForSubmit ? "text-gradient" : ""}>
          Create Room
        </span>
      )}
    </Button>
  );
}

export default function CreateRoom() {
  const router = useRouter();
  const { activeRoom, clearActive } = useActiveRoom();
  const [isPending, startTransition] = useTransition();

  const [selectedRole, setSelectedRole] = useState<RelationshipRole | null>(
    null
  );
  const [selectedEmoji, setSelectedEmoji] = useState<string>("");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [showAllRoles, setShowAllRoles] = useState(false);

  // Refs para manejar el focus
  const nameInputRef = useRef<HTMLInputElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const emojiSelectorRef = useRef<EmojiSelectorRef>(null);

  // Lista completa de roles
  const allRoles = [
    "girlfriend",
    "boyfriend",
    "partner",
    "friend",
    "roommate",
    "workmate",
    "gym bro",
    "sister",
    "gym girl",
  ] as RelationshipRole[];

  // Roles a mostrar (primeros 3 o todos)
  const rolesToShow = showAllRoles ? allRoles : allRoles.slice(0, 3);

  // Auto-focus en el input de nombre al cargar el componente
  useEffect(() => {
    if (!activeRoom && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [activeRoom]);

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

  // Action moderna con useActionState
  const [state, formAction] = useActionState(
    async (prevState: any, formData: FormData) => {
      try {
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

  const handleRoleChange = (role: RelationshipRole) => {
    setSelectedRole(role);
    setSelectedEmoji(""); // Reset emoji when role changes

    // Si se selecciona un rol de los primeros 3, colapsar la lista
    if (allRoles.slice(0, 3).includes(role)) {
      setShowAllRoles(false);
    }
  };

  // Función para manejar la selección de emoji y el focus
  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
    // Mover el focus al botón de submit después de seleccionar emoji
    setTimeout(() => {
      if (submitButtonRef.current) {
        submitButtonRef.current.focus();
      }
    }, 200);
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
            <div className="hidden sm:block text-blue-500 text-xl">🎯</div>
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
              <span className="hidden sm:block text-amber-300">⚠️</span>
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
        <h2 className="text-2xl font-bold">Create a Room</h2>
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
            className="w-full px-3 py-2 border bg-primary/5 rounded-lg focus:outline-2 focus:outline-purple-400/25 focus:outline-offset-2 disabled:cursor-not-allowed"
            placeholder="Enter your name"
            value={name}
            onChange={handleNameChange}
            autoComplete="off"
            spellCheck={false}
            maxLength={24}
            ref={nameInputRef}
          />
          <div className="mt-1 h-2 flex items-start">
            {nameError && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {nameError}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary/60 mb-3">
            Your Role in this Relationship
          </label>
          <div className="flex flex-wrap gap-2">
            {rolesToShow.map((role) => (
              <button
                key={role}
                type="button"
                disabled={isPending}
                onClick={() => handleRoleChange(role)}
                className={`
                  px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                  ${
                    selectedRole === role
                      ? "bg-accent text-accent-foreground border border-border"
                      : "bg-muted text-muted-foreground border border-border hover:bg-accent hover:text-accent-foreground"
                  }
                  ${
                    isPending
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }
                `}
              >
                <input
                  type="radio"
                  name="role"
                  value={role}
                  required
                  disabled={isPending}
                  checked={selectedRole === role}
                  onChange={() => handleRoleChange(role)}
                  className="sr-only"
                />
                <span className="capitalize">{role}</span>
              </button>
            ))}
          </div>
          {!showAllRoles && (
            <button
              type="button"
              onClick={() => setShowAllRoles(true)}
              className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              + more roles
            </button>
          )}
        </div>

        {selectedRole && (
          <EmojiSelector
            selectedEmoji={selectedEmoji}
            onEmojiSelect={handleEmojiSelect}
            name="emoji"
            disabled={isPending}
            ref={emojiSelectorRef}
          />
        )}

        <SubmitButton
          selectedRole={selectedRole}
          selectedEmoji={selectedEmoji}
          disabled={!!nameError || !name.trim()}
          submitButtonRef={submitButtonRef}
        />
      </form>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="hidden sm:block text-blue-500">ℹ️</span>
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
