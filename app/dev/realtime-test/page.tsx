"use client";
import React, { useState } from "react";
import RealtimeRoom from "@/components/realtime-room";
import Starfield from "@/components/starfield";

export default function RealtimeRoomTestPage({
  params,
}: {
  params: { roomId: string };
}) {
  const [starfieldEnabled, setStarfieldEnabled] = useState(true);
  return (
    <main className="relative flex flex-col items-center px-2 sm:px-8 py-12">
      {starfieldEnabled && <Starfield />}
      <div className="relative z-10 w-full max-w-5xl">
        <h1 className="text-2xl text-gradient font-bold mb-6 font-mono px-4">
          Realtime Room Draft UI
        </h1>
        <RealtimeRoom
          roomId={params.roomId}
          starfieldEnabled={starfieldEnabled}
          onToggleStarfield={() => setStarfieldEnabled((v) => !v)}
        />
      </div>
    </main>
  );
}
