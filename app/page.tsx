import SheetTest from "@/components/sheet-test";
import Diagnostics from "@/components/diagnostics";
import GradientBackground from "@/components/gradient-background";
import Link from "next/link";
import { enviroment } from "@/lib/env";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <GradientBackground variant="blue">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-6 font-mono">
            Imagine ur Partner
          </h1>
          <p className="text-xl text-primary/75 mx-auto mb-8">
            Describe your partner's personality through images. Discover how you
            see each other through animals, places, characters, and more.
          </p>
        </div>

        <div className="mx-auto space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              href="/room"
              className={cn(
                "block p-6 rounded-xl shadow-lg border group",
                "bg-amber-100/50 dark:bg-amber-900/25 backdrop-blur-sm",
                "border-amber-400 dark:border-amber-800",
                "hover:shadow-xl hover:scale-105 transition-all duration-300"
              )}
            >
              <div className="text-center">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  🖤
                </div>
                <h2 className="text-xl font-semibold mb-2 group-hover:text-amber-600 transition-colors duration-300">
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
                "block p-6 rounded-xl shadow-lg border group",
                "bg-purple-100/50 dark:bg-purple-900/25 backdrop-blur-sm",
                "border-purple-400 dark:border-purple-800",
                "hover:shadow-xl hover:scale-105 transition-all duration-300"
              )}
            >
              <div className="text-center">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  🤍
                </div>
                <h2 className="text-xl font-semibold mb-2 group-hover:text-purple-600 transition-colors duration-300">
                  Join Room
                </h2>
                <p className="text-primary/75 text-sm group-hover:text-primary/90 transition-colors duration-300">
                  Enter an existing room using a room ID from your partner
                </p>
              </div>
            </Link>
          </div>

          <div className="bg-card/75 rounded-xl shadow-lg p-6 border">
            <h3 className="text-lg font-semibold mb-4">How it works:</h3>
            <div className="space-y-3 text-sm text-primary/75">
              <div className="flex items-center gap-3">
                <span className="border bg-purple-100 text-purple-600 dark:text-purple-400 dark:bg-purple-950 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                  1
                </span>
                <p>Create or join a room with your partner</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="border bg-purple-100 text-purple-600 dark:text-purple-400 dark:bg-purple-950 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                  2
                </span>
                <p>
                  Upload images for 9 categories: animal, place, plant,
                  character, season, hobby, food, colour, and drink
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="border bg-purple-100 text-purple-600 dark:text-purple-400 dark:bg-purple-950 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                  3
                </span>
                <p>
                  When both partners are ready, reveal and compare your
                  personality descriptions
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-primary/75">
              ⏰ Rooms expire after 2.5 hours for privacy
            </p>
          </div>
        </div>

        {/* Development/Testing section - hidden in production */}
        <div className="mt-16 max-w-2xl mx-auto">
          <details className="bg-secondary/50 border rounded-lg p-4">
            <summary className="cursor-pointer text-primary/75 font-medium">
              🔧 Development Tools
            </summary>
            <div className="mt-4 space-y-4">
              {enviroment === "test" ? (
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
      </div>
    </GradientBackground>
  );
}
