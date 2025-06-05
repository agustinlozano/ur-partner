import GradientBackground from "@/components/gradient-background";

export default function Loading() {
  return (
    <GradientBackground className="py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-6 font-mono">
            Imagine ur Partner
          </h1>
          <p className="text-xl text-primary/75 mx-auto mb-8 px-4">
            Describe your partner&apos;s personality through images. Discover
            how you see each other through animals, places, characters, and
            more.
          </p>
        </div>

        {/* Loading state */}
        <div className="max-w-md mx-auto p-6 bg-card/60 rounded-xl shadow-lg border">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/20 border-t-primary"></div>
              <div className="absolute inset-1 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 animate-pulse"></div>
            </div>
            <p className="text-sm font-medium text-primary/80 animate-pulse">
              Preparing to join...
            </p>
          </div>
        </div>
      </div>
    </GradientBackground>
  );
}
