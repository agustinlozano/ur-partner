import PersonalityForm from "@/components/personality-form";
import SheetTest from "@/components/sheet-test";
import Diagnostics from "@/components/diagnostics";
import Link from "next/link";
import { HandHeart } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-200 to-blue-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Imagine ur Partner
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Describe your partner's personality through images. Discover how you
            see each other through animals, places, characters, and more.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              href="/room"
              className="block p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200 border border-gray-100"
            >
              <div className="text-center">
                <div className="text-4xl mb-3">🖤</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Create Room
                </h2>
                <p className="text-gray-600 text-sm">
                  Start a new personality sharing session with your partner
                </p>
              </div>
            </Link>

            <Link
              href="/join"
              className="block p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200 border border-gray-100"
            >
              <div className="text-center">
                <div className="text-4xl mb-3">🤍</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Join Room
                </h2>
                <p className="text-gray-600 text-sm">
                  Enter an existing room using a room ID from your partner
                </p>
              </div>
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              How it works:
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-3">
                <span className="bg-purple-100 text-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                  1
                </span>
                <p>Create or join a room with your partner</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-purple-100 text-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                  2
                </span>
                <p>
                  Upload images for 9 categories: animal, place, plant,
                  character, season, hobby, food, colour, and drink
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-purple-100 text-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
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
            <p className="text-sm text-gray-500">
              ⏰ Rooms expire after 2.5 hours for privacy
            </p>
          </div>
        </div>

        {/* Development/Testing section - hidden in production */}
        <div className="mt-16 max-w-2xl mx-auto">
          <details className="bg-gray-50 rounded-lg p-4">
            <summary className="cursor-pointer text-gray-700 font-medium">
              🔧 Development Tools
            </summary>
            <div className="mt-4 space-y-4">
              <Diagnostics />
              <SheetTest />
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
