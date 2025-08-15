import GradientBackground from "@/components/gradient-background";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Sparkles } from "@/components/sparkles";
import { BidirectionalBeam } from "@/components/bidirectional-animated-beam";
import VideoSteps from "@/components/video-steps";
import StatsSection from "@/components/stats-section";
import HoverCardDemo from "@/components/hover-card-demo";
import { MatrixBoard } from "@/components/ui/matrix-board";
import CopyrightYear from "@/components/copyright-year";
import FooterContent from "@/components/footer-content";

export default function Home() {
  return (
    <GradientBackground variant="blue">
      <div className="mx-2 py-12 relative md:mx-auto">
        <div className="text-center mb-6 max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 font-mono text-gradient text-balance">
            Imagine With Ur Partner
          </h1>
          <p className="text-xl md:text-3xl text-pretty font-mono text-primary/75 mx-auto">
            Describe your partner&apos;s personality through images. Discover
            how you see each other through animals, places, characters, and
            more.
          </p>
        </div>

        <BidirectionalBeam className="mb-8" />

        <div className="mx-auto space-y-6">
          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <Link
              href="/room"
              className={cn(
                "block p-6 rounded-xl shadow-lg border group select-none outline-none",
                "bg-gradient-to-t from-amber-400/20 to-amber-200/75 dark:from-amber-900/20 dark:to-amber-700/25",
                "border-amber-400 dark:border-amber-800",
                "hover:shadow-xl md:hover:scale-105 transition-all duration-300",
                "focus-visible:ring-4 focus-visible:ring-amber-400/50 dark:focus-visible:ring-amber-500/50",
                "focus-visible:border-amber-500 dark:focus-visible:border-amber-400",
                "focus-visible:shadow-2xl md:focus-visible:scale-110",
                "focus-visible:bg-gradient-to-t focus-visible:from-amber-300/30 focus-visible:to-amber-100/90",
                "dark:focus-visible:from-amber-800/30 dark:focus-visible:to-amber-600/40"
              )}
            >
              <div className="text-center">
                <div className="text-4xl mb-3 group-hover:scale-110 group-focus-visible:scale-125 group-focus-visible:animate-pulse transition-transform duration-300">
                  🖤
                </div>
                <h2 className="text-xl font-mono font-semibold mb-2 group-hover:text-amber-600 group-focus-visible:text-gradient transition-colors duration-300">
                  Create Room
                </h2>
                <p className="text-primary/75 text-pretty text-sm group-hover:text-primary/90 group-focus-visible:text-primary transition-colors duration-300">
                  Start a new personality sharing session with your partner
                </p>
              </div>
            </Link>

            <Link
              href="/join"
              className={cn(
                "block p-6 rounded-xl shadow-lg border group select-none outline-none",
                "bg-gradient-to-t from-purple-200/80 to-purple-600/30 dark:from-purple-900/20 dark:to-purple-700/25",
                "border-purple-400 dark:border-purple-800",
                "hover:shadow-xl md:hover:scale-105 transition-all duration-300",
                "focus-visible:ring-4 focus-visible:ring-purple-400/50 dark:focus-visible:ring-purple-500/50",
                "focus-visible:border-purple-500 dark:focus-visible:border-purple-400",
                "focus-visible:shadow-2xl md:focus-visible:scale-110",
                "focus-visible:bg-gradient-to-t focus-visible:from-purple-300/40 focus-visible:to-purple-500/40",
                "dark:focus-visible:from-purple-800/40 dark:focus-visible:to-purple-600/50"
              )}
            >
              <div className="text-center">
                <div className="text-4xl mb-3 group-hover:scale-110 group-focus-visible:scale-125 group-focus-visible:animate-pulse transition-transform duration-300">
                  🤍
                </div>
                <h2 className="text-xl font-mono font-semibold mb-2 group-hover:text-purple-600 group-focus-visible:text-gradient transition-colors duration-300">
                  Join Room
                </h2>
                <p className="text-primary/75 text-pretty text-sm group-hover:text-primary/90 group-focus-visible:text-primary transition-colors duration-300">
                  Enter an existing one using a room ID from your partner
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Stats Section */}
        <StatsSection className="mt-16 max-w-2xl mx-auto" />
        <HoverCardDemo className="mx-auto max-w-5xl mt-16" />
        <VideoSteps className="mx-auto max-w-4xl mt-16" />

        <div className="absolute top-32 z-[2] h-[400px] w-full overflow-hidden pointer-events-none [mask-image:radial-gradient(100%_50%,white,transparent)] before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_bottom_center,#3273ffaa,transparent_70%)] before:opacity-35 after:absolute">
          <Sparkles
            density={800}
            speed={1.2}
            size={1.2}
            direction="top"
            opacitySpeed={2}
            color="#9810fa"
            className="absolute inset-x-0 bottom-0 h-full w-full -z-10"
          />
        </div>
      </div>

      <footer className="relative mt-20 py-12 mx-2 bg-background/25 md:mx-auto overflow-x-hidden">
        <FooterContent />
        <div className="absolute bottom-0 left-0 right-0 bg-background/75 text-center text-muted-foreground py-4">
          <CopyrightYear />
        </div>
        <div className="absolute bottom-0 z-10 h-[300px] w-full overflow-hidden pointer-events-none [mask-image:radial-gradient(100%_50%,white,transparent)] before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_bottom_center,#3273ffaa,transparent_70%)] before:opacity-30 after:absolute">
          <Sparkles
            density={800}
            speed={1.2}
            size={1.2}
            direction="top"
            opacitySpeed={2}
            color="#9810fa"
            className="absolute inset-x-0 bottom-0 h-full w-full -z-10"
          />
        </div>
      </footer>
    </GradientBackground>
  );
}
