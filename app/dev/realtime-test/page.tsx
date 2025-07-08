"use client";
import React, { useState } from "react";
import RealtimeRoom from "@/components/realtime-room";
import Starfield from "@/components/starfield";

export default function RealtimeRoomTestPage() {
  const [starfieldEnabled, setStarfieldEnabled] = useState(true);
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center p-8 overflow-hidden">
      {starfieldEnabled && <Starfield />}
      <div className="relative z-10 w-full max-w-5xl">
        <h1 className="text-2xl font-bold mb-6 font-mono px-4">
          Realtime Room Draft UI Test
        </h1>
        <RealtimeRoom
          starfieldEnabled={starfieldEnabled}
          onToggleStarfield={() => setStarfieldEnabled((v) => !v)}
        />
      </div>
    </main>
  );
}
