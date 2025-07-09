"use client";

import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";
import { useSoundPlayer, SOUNDS } from "@/hooks/useSoundStore";

interface CopyRoomIdProps {
  roomId: string;
}

export default function CopyRoomId({ roomId }: CopyRoomIdProps) {
  const [copied, setCopied] = useState(false);
  const [domain, setDomain] = useState("");

  const playSound = useSoundPlayer();

  useEffect(() => {
    setDomain(
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : `https://${window.location.hostname}`
    );
  }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${domain}/join/${roomId}`);
      setCopied(true);
      playSound(SOUNDS.tap);
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = roomId;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      } catch (err) {
        console.error("Failed to copy text: ", err);
      }

      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="relative mb-4">
      <div
        onClick={copyToClipboard}
        className="bg-primary/5 hover:bg-primary/10 rounded-lg p-4 border-2 border-dashed hover:border-purple-400 transition-all duration-200 cursor-pointer group"
      >
        <div className="flex items-center justify-center gap-3">
          <code className="text-2xl font-mono select-none font-bold text-gradient group-hover:text-purple-700 transition-colors">
            {roomId}
          </code>

          <div className="text-gray-400 group-hover:text-purple-500 transition-colors">
            {copied ? (
              <Check className="h-5 w-5 text-emerald-600" />
            ) : (
              <Copy className="h-5 w-5" />
            )}
          </div>
        </div>

        <p className="text-xs select-none text-primary/60 text-center mt-2 group-hover:text-primary/90 transition-colors">
          {copied ? "Copied to clipboard!" : "Click to copy to clipboard"}
        </p>
      </div>

      {copied && (
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-emerald-200 border border-emerald-400 dark:bg-emerald-950 dark:border-emerald-800 text-sm px-3 py-1 rounded-lg shadow-lg animate-fade-in-out z-10">
          <div className="flex items-center gap-1">
            <Check className="h-3 w-3" />
            Copied!
          </div>
          {/* Arrow pointing down */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-green-600"></div>
        </div>
      )}
    </div>
  );
}
