"use client";

interface EmojiSelectorProps {
  role: "girlfriend" | "boyfriend" | null;
  selectedEmoji: string;
  onEmojiSelect: (emoji: string) => void;
  name: string;
  disabled?: boolean;
}

export default function EmojiSelector({
  role,
  selectedEmoji,
  onEmojiSelect,
  name,
  disabled = false,
}: EmojiSelectorProps) {
  const girlfriendEmojis = ["👧", "👧🏻", "👧🏼", "👧🏽", "👧🏾", "👧🏿"];
  const boyfriendEmojis = ["👦", "👦🏻", "👦🏼", "👦🏽", "👦🏾", "👦🏿"];

  const getEmojisForRole = () => {
    if (role === "girlfriend") return girlfriendEmojis;
    if (role === "boyfriend") return boyfriendEmojis;
    return [];
  };

  const emojis = getEmojisForRole();

  if (!role) {
    return null;
  }

  return (
    <div>
      <label className="block text-sm font-medium text-primary/75 mb-3">
        Choose Your Avatar
      </label>

      <div className="grid grid-cols-6 gap-2 p-4 bg-primary/5 rounded-lg border ">
        {emojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            disabled={disabled}
            onClick={() => onEmojiSelect(emoji)}
            className={`
              p-3 text-2xl rounded-lg border-2 transition-all duration-200 hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50
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

      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={selectedEmoji} required />
    </div>
  );
}
