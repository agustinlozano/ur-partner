import CreateRoom from "@/components/create-room";
import GradientBackground from "@/components/gradient-background";

export default function RoomPage() {
  return (
    <GradientBackground className="py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-6">Imagine ur Partner</h1>
          <p className="text-xl text-primary/90 max-w-3xl mx-auto mb-8">
            Describe your partner's personality through images. Discover how you
            see each other through animals, places, characters, and more.
          </p>
        </div>

        <CreateRoom />

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Already have a room?{" "}
            <a
              href="/join"
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Join existing room
            </a>
          </p>
        </div>
      </div>
    </GradientBackground>
  );
}
