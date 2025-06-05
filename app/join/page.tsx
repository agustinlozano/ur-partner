import JoinRoom from "@/components/join-room";
import GradientBackground from "@/components/gradient-background";
import Link from "next/link";

interface JoinPageProps {
  searchParams: { room_id?: string };
}

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const { room_id } = await searchParams;

  return (
    <GradientBackground className="py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-mono mb-6">
            Join Your Partner&apos;s Room
          </h1>
          <p className="text-xl text-primary/75 mx-auto mb-8 max-w-lg">
            Enter the Room ID shared by your partner to join their personality
            sharing session.
          </p>
        </div>

        <JoinRoom initialRoomId={room_id} />

        <div className="mt-8 text-center space-y-8">
          <p className="text-sm text-primary/75">
            Don&apos;t have a Room ID?{" "}
            <Link
              href="/room"
              className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
            >
              Create a new room
            </Link>
          </p>
          <p className="text-sm text-primary/75">
            <Link
              href="/"
              className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
            >
              ← Back to Home
            </Link>
          </p>
        </div>
      </div>
    </GradientBackground>
  );
}
