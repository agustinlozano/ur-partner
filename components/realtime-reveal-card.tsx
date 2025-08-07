import React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";

interface RealtimeRevealCardProps {
  roomId: string;
  canReveal: boolean;
  isRevealing: boolean;
  onReveal: () => void;
}

export function RealtimeRevealCard({
  roomId,
  canReveal,
  isRevealing,
  onReveal,
}: RealtimeRevealCardProps) {
  const router = useRouter();

  const handleRevealClick = () => {
    if (isRevealing) return;
    onReveal();
    router.push(`/room/${roomId}/reveal`);
  };

  return (
    <AnimatePresence>
      {canReveal && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
            duration: 0.6,
          }}
          className="text-center p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800 shadow-2xl"
        >
          <div className="text-4xl mb-3">✨</div>
          <strong className="font-bold font-mono text-purple-800 dark:text-purple-200 text-lg mb-2">
            Stunning Reveal!
          </strong>
          <div className="text-sm text-purple-600 dark:text-purple-400 mb-4">
            Time to discover how you see each other...
          </div>
          <Button
            variant="shadow"
            size="lg"
            disabled={isRevealing}
            onClick={handleRevealClick}
            className="w-full flex items-center justify-center gap-2 text-lg py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
          >
            {isRevealing ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Starting Reveal...</span>
              </div>
            ) : (
              <>
                <span>🔮</span>
                <span>Reveal Personalities</span>
              </>
            )}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
