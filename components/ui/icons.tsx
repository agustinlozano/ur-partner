import { cn } from "@/lib/utils";
import React from "react";

export function XIcon({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="396"
      height="396"
      fill="none"
      viewBox="0 0 396 396"
      className={cn("size-4", className)}
      {...props}
    >
      <path
        fill="currentColor"
        d="M301.026 37.125h54.582l-119.246 136.29 140.283 185.46h-109.84l-86.031-112.48-98.439 112.48H27.72l127.545-145.777L20.691 37.125H133.32l77.764 102.812 89.942-102.812Zm-19.157 289.08h30.245L116.886 68.079H84.43L281.87 326.205Z"
      />
    </svg>
  );
}
