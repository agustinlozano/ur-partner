import SheetTest from "@/components/sheet-test";
import Diagnostics from "@/components/diagnostics";
import GradientBackground from "@/components/gradient-background";
import Link from "next/link";
import { enviroment } from "@/lib/env";
import { cn } from "@/lib/utils";
import { Sparkles } from "@/components/sparkles";
import { BidirectionalBeam } from "@/components/bidirectional-animated-beam";
import { XIcon } from "@/components/ui/icons";

export default function Home() {
  return (
    <GradientBackground variant="blue">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-6 font-mono text-gradient text-balance">
            Imagine with ur Partner
          </h1>
          <p className="text-xl text-primary/75 mx-auto">
            Describe your partner&apos;s personality through images. Discover
            how you see each other through animals, places, characters, and
            more.
          </p>
        </div>

        <BidirectionalBeam className="mb-10" />

        <div className="mx-auto space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              href="/room"
              className={cn(
                "block p-6 rounded-xl shadow-lg border group select-none",
                "bg-gradient-to-t from-amber-400/20 to-amber-200/75 dark:from-amber-900/20 dark:to-amber-700/25",
                "border-amber-400 dark:border-amber-800",
                "hover:shadow-xl hover:scale-105 transition-all duration-300"
              )}
            >
              <div className="text-center">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  🖤
                </div>
                <h2 className="text-xl font-mono font-semibold mb-2 group-hover:text-amber-600 transition-colors duration-300">
                  Create Room
                </h2>
                <p className="text-primary/75 text-sm group-hover:text-primary/90 transition-colors duration-300">
                  Start a new personality sharing session with your partner
                </p>
              </div>
            </Link>

            <Link
              href="/join"
              className={cn(
                "block p-6 rounded-xl shadow-lg border group select-none",
                "bg-gradient-to-t from-purple-200/80 to-purple-600/30 dark:from-purple-900/20 dark:to-purple-700/25",
                "border-purple-400 dark:border-purple-800",
                "hover:shadow-xl hover:scale-105 transition-all duration-300"
              )}
            >
              <div className="text-center">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  🤍
                </div>
                <h2 className="text-xl font-mono font-semibold mb-2 group-hover:text-purple-600 transition-colors duration-300">
                  Join Room
                </h2>
                <p className="text-primary/75 text-sm group-hover:text-primary/90 transition-colors duration-300">
                  Enter an existing one using a room ID from your partner
                </p>
              </div>
            </Link>
          </div>

          <Sparkles
            density={800}
            speed={1.2}
            size={1.2}
            direction="top"
            opacitySpeed={2}
            color="#9810fa"
            className="absolute inset-x-0 bottom-0 h-full w-full -z-10"
          />

          <div className="bg-card/75 rounded-xl shadow-lg p-6 mt-28 border">
            <h3 className="text-lg font-semibold mb-4">How it works</h3>
            <div className="space-y-3 text-sm text-primary/90">
              <div className="flex items-center gap-3">
                <span className="border bg-secondary rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                  1
                </span>
                <p>Create or join a room with your partner</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="border bg-secondary rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                  2
                </span>
                <p>
                  Upload images for 9 categories: animal, place, plant,
                  character, season, hobby, food, colour, and drink
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="border bg-secondary rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                  3
                </span>
                <p>
                  When both partners are ready, reveal and compare your
                  personality descriptions
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* aesthetic section with my emoji */}
        <div className="mt-16 max-w-2xl mx-auto">
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
                className="inline-flex w-fit items-center gap-2 px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-300 font-medium text-sm"
              >
                <XIcon className="w-4 h-4" />
                @gustinlzn
              </a>
            </div>
          </div>
        </div>

        {/* Development/Testing section - hidden in production */}
        {enviroment === "development" && (
          <div className="mt-16 max-w-2xl mx-auto">
            <details className="bg-secondary/50 border rounded-lg p-4">
              <summary className="cursor-pointer text-primary/75 font-medium">
                🔧 Development Tools
              </summary>
              <div className="mt-4 space-y-4">
                {enviroment === "development" ? (
                  <>
                    <Diagnostics />
                    <SheetTest />
                  </>
                ) : (
                  <p className="text-red-500 dark:text-red-300">
                    You must be an admin to see this section.
                  </p>
                )}
              </div>
            </details>
          </div>
        )}

        <div className="text-center max-w-2xl my-4">
          <p className="text-sm mx-auto py-2 text-primary/75 rounded-lg border border-red-400 bg-red-200 dark:bg-red-900/20 dark:border-red-800">
            ⏰ Rooms expire after 2.5 hours for privacy
          </p>
        </div>
      </div>
    </GradientBackground>
  );
}
