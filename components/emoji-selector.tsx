"use client";

import {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface EmojiSelectorProps {
  selectedEmoji: string;
  onEmojiSelect: (emoji: string) => void;
  name: string;
  disabled?: boolean;
}

export interface EmojiSelectorRef {
  focusFirstEmoji: () => void;
}

const EmojiSelector = forwardRef<EmojiSelectorRef, EmojiSelectorProps>(
  ({ selectedEmoji, onEmojiSelect, name, disabled = false }, ref) => {
    // Separate emoji arrays
    const femaleEmojis = ["👧", "👧🏻", "👧🏼", "👧🏽", "👧🏾", "👧🏿"];
    const maleEmojis = ["👦", "👦🏻", "👦🏼", "👦🏽", "👦🏾", "👦🏿"];

    const [activeTab, setActiveTab] = useState<string>("female");
    const [focusedEmojiIndex, setFocusedEmojiIndex] = useState<number>(0);
    const femaleButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const maleButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);

    // Get current emoji list and refs based on active tab
    const getCurrentEmojis = () =>
      activeTab === "female" ? femaleEmojis : maleEmojis;
    const getCurrentRefs = () =>
      activeTab === "female" ? femaleButtonRefs : maleButtonRefs;

    // Exponer la función focusFirstEmoji al componente padre
    useImperativeHandle(ref, () => ({
      focusFirstEmoji: () => {
        const refs = getCurrentRefs();
        if (refs.current[0]) {
          refs.current[0].focus();
          setFocusedEmojiIndex(0);
        }
      },
    }));

    // Auto-focus en el primer emoji cuando se monta el componente o cambia tab
    // useEffect(() => {
    //   setTimeout(() => {
    //     const refs = getCurrentRefs();
    //     if (refs.current[0]) {
    //       refs.current[0].focus();
    //       setFocusedEmojiIndex(0);
    //     }
    //   }, 100);
    // }, [activeTab]);

    // Manejar navegación por teclado
    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
      if (disabled) return;

      const emojis = getCurrentEmojis();
      const refs = getCurrentRefs();

      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          const nextIndex = (index + 1) % emojis.length;
          setFocusedEmojiIndex(nextIndex);
          refs.current[nextIndex]?.focus();
          break;
        case "ArrowLeft":
          e.preventDefault();
          const prevIndex = (index - 1 + emojis.length) % emojis.length;
          setFocusedEmojiIndex(prevIndex);
          refs.current[prevIndex]?.focus();
          break;
        case "ArrowDown":
          e.preventDefault();
          // Switch to male tab
          if (activeTab === "female") {
            setActiveTab("male");
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          // Switch to female tab
          if (activeTab === "male") {
            setActiveTab("female");
          }
          break;
        case "Tab":
          // Let tab work normally for switching between tabs
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          onEmojiSelect(emojis[index]);
          break;
      }
    };

    // Render emoji grid for a specific gender
    const renderEmojiGrid = (
      emojis: string[],
      refs: React.MutableRefObject<(HTMLButtonElement | null)[]>,
      gender: "female" | "male"
    ) => (
      <motion.div
        key={gender}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="grid grid-cols-6 gap-2 p-3 bg-gradient-to-br from-white/50 to-gray-50/50 dark:from-slate-800/50 dark:to-slate-900/50 rounded-lg border border-gray-200/50 dark:border-gray-700/50"
      >
        {emojis.map((emoji, index) => (
          <button
            key={emoji}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            disabled={disabled}
            onClick={() => onEmojiSelect(emoji)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`
              p-1 md:p-2 text-2xl rounded-lg border-2 transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-2 focus:outline-purple-400/25 focus:outline-offset-2
              ${
                selectedEmoji === emoji
                  ? "border-purple-300 dark:border-purple-500 bg-purple-100 dark:bg-purple-950"
                  : "hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 bg-white/70 dark:bg-slate-800/70 border-gray-200 dark:border-gray-700"
              }
            `}
          >
            {emoji}
          </button>
        ))}
      </motion.div>
    );

    return (
      <div>
        <label className="block text-sm font-medium text-primary/75 mb-3">
          Choose Your Avatar
        </label>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="female" className="relative overflow-hidden">
              <motion.span
                initial={false}
                animate={{
                  scale: activeTab === "female" ? 1.05 : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                👧 Female
              </motion.span>
            </TabsTrigger>
            <TabsTrigger value="male" className="relative overflow-hidden">
              <motion.span
                initial={false}
                animate={{
                  scale: activeTab === "male" ? 1.05 : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                👦 Male
              </motion.span>
            </TabsTrigger>
          </TabsList>

          <div className="relative">
            <AnimatePresence mode="wait">
              <TabsContent key="female" value="female" className="mt-0">
                {renderEmojiGrid(femaleEmojis, femaleButtonRefs, "female")}
              </TabsContent>

              <TabsContent key="male" value="male" className="mt-0">
                {renderEmojiGrid(maleEmojis, maleButtonRefs, "male")}
              </TabsContent>
            </AnimatePresence>
          </div>
        </Tabs>

        {selectedEmoji && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg dark:from-blue-950/50 dark:to-indigo-950/50 dark:border-blue-800"
          >
            <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-300">
              <span className="text-lg">{selectedEmoji}</span>
              <span>
                You will appear as <strong>{selectedEmoji}</strong> in the room
              </span>
            </div>
          </motion.div>
        )}

        <div className="mt-2 text-xs text-primary/60">
          <p>💡 Use ←→ for navigation, ↑↓ to switch tabs, Enter to select</p>
        </div>

        {/* Hidden input for form submission */}
        <input type="hidden" name={name} value={selectedEmoji} required />
      </div>
    );
  }
);

export default EmojiSelector;
