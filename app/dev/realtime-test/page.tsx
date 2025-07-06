import React from "react";
import RealtimeRoom from "@/components/realtime-room";

// If RealtimeRoom requires props, provide mock/placeholder values here
// For now, render it directly as a draft UI test

export default function RealtimeRoomTestPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
      <h1 className="text-2xl font-bold mb-6">Realtime Room Draft UI Test</h1>
      <div className="w-full max-w-3xl">
        <RealtimeRoom />
      </div>
    </main>
  );
}
