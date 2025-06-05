"use client";

import { ThemeToggle } from "@/components/theme-toggle";

export default function ThemeToggleButton() {
  return (
    <div className="fixed top-4 right-4 z-50">
      <ThemeToggle />
    </div>
  );
}
