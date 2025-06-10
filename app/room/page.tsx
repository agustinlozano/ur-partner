import CreateRoom from "@/components/create-room";
import GradientBackground from "@/components/gradient-background";
import Link from "next/link";

export default function RoomPage() {
  return (
    <GradientBackground className="py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-6 font-mono text-balance text-gradient">
            Imagine with your Partner
          </h1>
          <p className="text-xl text-primary/75 mx-auto mb-8 px-4">
            Describe your partner&apos;s personality through images. Discover
            how you see each other through animals, places, characters, and
            more.
          </p>
        </div>

        <CreateRoom />

        <div className="mt-8 text-center">
          <p className="text-sm text-primary/85">
            Already have a room?{" "}
            <Link
              href="/join"
              className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
            >
              Join existing room
            </Link>
          </p>
        </div>
      </div>
    </GradientBackground>
  );
}
