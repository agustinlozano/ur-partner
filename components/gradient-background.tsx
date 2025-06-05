import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface GradientBackgroundProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "blue";
}

export default function GradientBackground({
  children,
  className,
  variant = "default",
  ...props
}: GradientBackgroundProps) {
  const gradientClasses = {
    default:
      "bg-gradient-to-br from-pink-50/60 via-purple-200/60 to-blue-50/60 dark:from-pink-950/20 dark:via-purple-950/30 dark:to-blue-950/20",
    blue: "bg-gradient-to-br from-pink-50/60 via-purple-200/60 to-blue-100/60 dark:from-pink-950/20 dark:via-purple-950/30 dark:to-blue-950/30",
  };

  return (
    <div
      className={cn("min-h-screen", gradientClasses[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}
