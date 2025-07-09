"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSoundPlayer, SOUNDS } from "@/hooks/useSoundStore";

export function ThemeToggle({ forceDark = false }: { forceDark?: boolean }) {
  const { setTheme, theme } = useTheme();
  const playSound = useSoundPlayer();

  React.useEffect(() => {
    if (forceDark) setTheme("dark");
  }, [forceDark, setTheme]);

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => {
        if (!forceDark) {
          setTheme(theme === "light" ? "dark" : "light");
          playSound(SOUNDS.tap);
        } else toast.warning("This is a dark-only mode page :)");
      }}
      className="relative"
      // disabled={forceDark}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
