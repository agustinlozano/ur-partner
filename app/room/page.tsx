import CreateRoom from "@/components/create-room";

export default function RoomPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Describe Your Partner 🤍
          </h1>
          <p className="text-lg text-gray-600 max-w-lg mx-auto">
            Create a room to share personality images with your special someone.
            Discover how you see each other through 9 carefully chosen
            categories.
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
    </div>
  );
}
