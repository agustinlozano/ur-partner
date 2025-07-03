"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { enviroment } from "@/lib/env";
import { CornerDownLeft, ArrowRightToLine } from "lucide-react";

const KEY_DISPLAY_MAP: Record<string, string | React.ReactNode> = {
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  Tab: <ArrowRightToLine size={28} />,
  Enter: <CornerDownLeft size={28} />,
};

const TRACKED_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Tab",
  "Enter",
]);

export function DevKeyTracker() {
  useEffect(() => {
    if (enviroment !== "development") {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (TRACKED_KEYS.has(event.key)) {
        const displayKey = KEY_DISPLAY_MAP[event.key];

        toast(displayKey, {
          duration: 1200,
          position: "bottom-center",
          style: {
            fontSize: "24px",
            fontWeight: "600",
            padding: "10px 20px",
            borderRadius: "12px",
            backdropFilter: "blur(12px)",
            transform: "translateY(-10px)",
            textAlign: "center",
          },
          className:
            "font-mono tracking-widest flex items-center justify-center",
        });
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // No renderiza nada visible
  return null;
}
