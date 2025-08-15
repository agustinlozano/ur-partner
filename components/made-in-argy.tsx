import { cn } from "@/lib/utils";
import s from "./footer.module.css";

function ArgentinaFlag({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Blue stripes */}
      <rect width="24" height="16" rx="2" fill="#74ACDF" />
      {/* White stripe */}
      <rect width="24" height="5.33" fill="#FFFFFF" y="5.33" />
      {/* Sun of May */}
      <circle
        cx="12"
        cy="8"
        r="1.5"
        fill="#FFBF00"
        stroke="#F6B40E"
        strokeWidth="0.3"
      />
      {/* Sun rays */}
      <g fill="#F6B40E">
        <path d="M12 6.2 L12.2 7.5 L11.8 7.5 Z" />
        <path d="M13.8 8 L12.5 8.2 L12.5 7.8 Z" />
        <path d="M12 9.8 L11.8 8.5 L12.2 8.5 Z" />
        <path d="M10.2 8 L11.5 7.8 L11.5 8.2 Z" />
      </g>
    </svg>
  );
}

export function MadeInArgy() {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-all duration-300",
        s.madeInArgy
      )}
    >
      <div className="flex items-center gap-3">
        <ArgentinaFlag className="h-6 w-8 rounded-sm" />
        <div className="flex flex-col">
          <span className={cn("font-medium font-mono text-sm", s.argyTitle)}>
            Made in Argentina
          </span>
          <span className={cn("text-xs opacity-80 italic", s.argySubtitle)}>
            Hola, che.
          </span>
        </div>
      </div>
    </div>
  );
}
