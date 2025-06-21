// import SheetTest from "@/components/sheet-test";
// import Diagnostics from "@/components/diagnostics";
import GradientBackground from "@/components/gradient-background";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Sparkles } from "@/components/sparkles";
import { BidirectionalBeam } from "@/components/bidirectional-animated-beam";
import { XIcon } from "@/components/ui/icons";
import VideoSteps from "@/components/video-steps";
import StatsSection from "@/components/stats-section";

export default function Home() {
  return (
    <GradientBackground variant="blue">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-10 max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 font-mono text-gradient text-balance">
            Imagine With Ur Partner
          </h1>
          <p className="text-xl md:text-3xl text-pretty font-mono text-primary/75 mx-auto">
            Describe your partner&apos;s personality through images. Discover
            how you see each other through animals, places, characters, and
            more.
          </p>
        </div>

        <BidirectionalBeam className="mb-10" />

        <div className="mx-auto space-y-6">
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
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
                <p className="text-primary/75 text-sm group-hover:text-primary/90 group-focus-visible:text-primary transition-colors duration-300">
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
                <p className="text-primary/75 text-sm group-hover:text-primary/90 group-focus-visible:text-primary transition-colors duration-300">
                  Enter an existing one using a room ID from your partner
                </p>
              </div>
            </Link>
          </div>

          {/* Stats Section */}
          <StatsSection />

          <Sparkles
            density={800}
            speed={1.2}
            size={1.2}
            direction="top"
            opacitySpeed={2}
            color="#9810fa"
            className="absolute inset-x-0 bottom-0 h-full w-full -z-10"
          />

          <VideoSteps />
        </div>

        {/* aesthetic section with my emoji */}
        <div className="mt-16 max-w-3xl mx-auto select-none">
          <div className="flex gap-x-8 items-center justify-between space-y-4 bg-card/75 rounded-xl shadow-lg p-8 border">
            <img
              src="/emoji.webp"
              alt="Agustin's avatar"
              className="w-28 mb-0 rounded-md object-cover border-2 border-primary/20 shadow-md"
            />

            <div className="grow flex flex-col gap-4">
              <div>
                <h3 className="text-xl font-bold font-mono">Agustin</h3>
                <p className="text-primary/80 text-base">
                  Guy from Argentina 🇦🇷 doin' software.
                </p>
              </div>
              <a
                href="https://x.com/gustinlzn"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center gap-2 px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-300 font-medium text-sm outline-none focus-visible:ring-4 focus-visible:ring-gray-400/50 focus-visible:scale-105 focus-visible:shadow-lg"
              >
                <XIcon className="w-4 h-4" />
                @gustinlzn
              </a>
            </div>
          </div>
        </div>
      </div>
    </GradientBackground>
  );
}
