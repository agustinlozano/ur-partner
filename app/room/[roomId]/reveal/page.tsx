import { Suspense } from "react";
import RevealContent from "@/components/reveal-content";
import GradientBackground from "@/components/gradient-background";

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default async function RevealPage({ params }: PageProps) {
  const { roomId } = await params;

  return (
    <GradientBackground className="min-h-screen">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
              <p className="text-lg font-medium">Preparing your reveal...</p>
            </div>
          </div>
        }
      >
        <RevealContent roomId={roomId} />
      </Suspense>
    </GradientBackground>
  );
}
