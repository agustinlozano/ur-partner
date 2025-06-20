"use client";

import {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";

interface EmojiSelectorProps {
  role: "girlfriend" | "boyfriend" | null;
  selectedEmoji: string;
  onEmojiSelect: (emoji: string) => void;
  onRoleChange: (role: "girlfriend" | "boyfriend") => void;
  name: string;
  disabled?: boolean;
}

export interface EmojiSelectorRef {
  focusFirstEmoji: () => void;
}

const EmojiSelector = forwardRef<EmojiSelectorRef, EmojiSelectorProps>(
  (
    {
      role,
      selectedEmoji,
      onEmojiSelect,
      onRoleChange,
      name,
      disabled = false,
    },
    ref
  ) => {
    const girlfriendEmojis = ["👧", "👧🏻", "👧🏼", "👧🏽", "👧🏾", "👧🏿"];
    const boyfriendEmojis = ["👦", "👦🏻", "👦🏼", "👦🏽", "👦🏾", "👦🏿"];

    const [focusedEmojiIndex, setFocusedEmojiIndex] = useState<number>(0);
    const [showEmojis, setShowEmojis] = useState<boolean>(false);
    const emojiContainerRef = useRef<HTMLDivElement>(null);
    const emojiButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const getEmojisForRole = () => {
      if (role === "girlfriend") return girlfriendEmojis;
      if (role === "boyfriend") return boyfriendEmojis;
      return [];
    };

    const emojis = getEmojisForRole();

    // Exponer la función focusFirstEmoji al componente padre
    useImperativeHandle(ref, () => ({
      focusFirstEmoji: () => {
        if (emojiButtonRefs.current[0]) {
          emojiButtonRefs.current[0].focus();
          setFocusedEmojiIndex(0);
        }
      },
    }));

    // Mostrar emojis automáticamente cuando se selecciona un rol
    useEffect(() => {
      if (role) {
        setShowEmojis(true);
        setFocusedEmojiIndex(0);
        // Focus en el primer emoji después de un breve delay
        setTimeout(() => {
          if (emojiButtonRefs.current[0]) {
            emojiButtonRefs.current[0].focus();
          }
        }, 100);
      }
    }, [role]);

    // Manejar navegación por teclado
    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
      if (disabled) return;

      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          const nextIndex = (index + 1) % emojis.length;
          setFocusedEmojiIndex(nextIndex);
          emojiButtonRefs.current[nextIndex]?.focus();
          break;
        case "ArrowLeft":
          e.preventDefault();
          const prevIndex = (index - 1 + emojis.length) % emojis.length;
          setFocusedEmojiIndex(prevIndex);
          emojiButtonRefs.current[prevIndex]?.focus();
          break;
        case "ArrowDown":
          e.preventDefault();
          // Cambiar al siguiente rol
          if (role === "girlfriend") {
            onRoleChange("boyfriend");
          } else if (role === "boyfriend") {
            onRoleChange("girlfriend");
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          // Cambiar al rol anterior
          if (role === "boyfriend") {
            onRoleChange("girlfriend");
          } else if (role === "girlfriend") {
            onRoleChange("boyfriend");
          }
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          onEmojiSelect(emojis[index]);
          break;
      }
    };

    if (!role) {
      return null;
    }

    return (
      <div>
        <label className="block text-sm font-medium text-primary/75 mb-3">
          Choose Your Avatar
        </label>

        <div
          ref={emojiContainerRef}
          className="grid grid-cols-6 gap-2 p-4 bg-primary/5 rounded-lg border"
        >
          {emojis.map((emoji, index) => (
            <button
              key={emoji}
              ref={(el) => {
                emojiButtonRefs.current[index] = el;
              }}
              type="button"
              disabled={disabled}
              onClick={() => onEmojiSelect(emoji)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`
              p-1 md:p-2 text-2xl rounded-lg border-2 transition-all duration-200 hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-2 focus:outline-pink-400/25 focus:outline-offset-2
              ${
                selectedEmoji === emoji
                  ? "border-purple-300 dark:border-purple-500 bg-purple-100 shadow-md dark:bg-purple-950"
                  : "hover:border-purple-300 hover:bg-purple-100 dark:hover:bg-purple-700 bg-primary/10 dark:border-purple-600"
              }
            `}
            >
              {emoji}
            </button>
          ))}
        </div>

        {selectedEmoji && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
            <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-300">
              <span className="text-lg">{selectedEmoji}</span>
              <span>
                You will appear as <strong>{selectedEmoji}</strong> in the room
              </span>
            </div>
          </div>
        )}

        <div className="mt-2 text-xs text-primary/60">
          <p>💡 Use ←→ for emojis, ↑↓ to switch roles, Enter to select</p>
        </div>

        {/* Hidden input for form submission */}
        <input type="hidden" name={name} value={selectedEmoji} required />
      </div>
    );
  }
);

export default EmojiSelector;
