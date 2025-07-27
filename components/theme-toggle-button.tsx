"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { usePathname } from "next/navigation";

export default function ThemeToggleButton() {
  const pathname = usePathname();
  const forceDark = pathname.includes("realtime");
  return (
    <div className="fixed top-4 right-4 z-50">
      <ThemeToggle forceDark={forceDark} />
    </div>
  );
}
