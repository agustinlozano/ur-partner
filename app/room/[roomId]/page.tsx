import { Button } from "@/components/ui/button";
import { getRoomData } from "@/lib/actions";
import Link from "next/link";
import ActiveRoomSaver from "@/components/active-room-saver";
import CopyRoomId from "@/components/copy-room-id";

interface PageProps {
  params: Promise<{ roomId: string }>;
  searchParams?: Promise<{
    new?: string;
    role?: "girlfriend" | "boyfriend";
    name?: string;
    emoji?: string;
  }>;
}

export default async function RoomDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { roomId } = await params;
  const searchParamsData = searchParams ? await searchParams : {};
  const room = await getRoomData(roomId);

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50/60 via-purple-200/60 to-blue-50/60 flex items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-6xl mb-4">😔</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Room Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              This room doesn't exist or has expired. Rooms automatically expire
              after 2.5 hours for privacy.
            </p>
            <Link
              href="/room"
              className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
            >
              Create New Room
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isGirlfriendMissing = !room.girlfriend_name;
  const isBoyfriendMissing = !room.boyfriend_name;
  const missingPartner = isGirlfriendMissing
    ? "girlfriend"
    : isBoyfriendMissing
    ? "boyfriend"
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/60 via-purple-200/60 to-blue-50/60 py-12 px-4">
      {/* Save active room data if coming from new room creation/join */}
      {searchParamsData.new === "true" &&
        searchParamsData.role &&
        searchParamsData.name &&
        searchParamsData.emoji && (
          <ActiveRoomSaver
            roomId={roomId}
            role={searchParamsData.role}
            name={decodeURIComponent(searchParamsData.name)}
            emoji={decodeURIComponent(searchParamsData.emoji)}
          />
        )}

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl text-gray-900 mb-4 uppercase font-mono">
            Room {roomId}
          </h1>
          <p className="text-lg text-gray-600">
            {missingPartner
              ? `Waiting for ${missingPartner} to join...`
              : "Both partners are in the room!"}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Girlfriend Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="text-center">
              <div className="text-4xl mb-3">
                {room.girlfriend_emoji || "💕"}
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Girlfriend
              </h2>
              {room.girlfriend_name ? (
                <div>
                  <p className="text-lg text-pink-600 font-medium mb-2">
                    {room.girlfriend_name}
                  </p>
                  <span className="inline-block bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                    ✅ Joined
                  </span>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 mb-2">Waiting to join...</p>
                  <span className="inline-block bg-yellow-100 text-yellow-800 text-sm px-3 py-1 rounded-full">
                    ⏳ Pending
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Boyfriend Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="text-center">
              <div className="text-4xl mb-3">
                {room.boyfriend_emoji || "💙"}
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Boyfriend
              </h2>
              {room.boyfriend_name ? (
                <div>
                  <p className="text-lg text-blue-600 font-medium mb-2">
                    {room.boyfriend_name}
                  </p>
                  <span className="inline-block bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                    ✅ Joined
                  </span>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 mb-2">Waiting to join...</p>
                  <span className="inline-block bg-yellow-100 text-yellow-800 text-sm px-3 py-1 rounded-full">
                    ⏳ Pending
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {missingPartner && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-8">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Share this Room ID with your partner
              </h3>
              <CopyRoomId roomId={roomId} />
              <p className="text-gray-600 text-sm">
                Your partner can join by visiting <strong>/join</strong> and
                entering this room ID
              </p>
            </div>
          </div>
        )}

        {!missingPartner && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-8">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                🎉 Ready to Start!
              </h3>
              <p className="text-gray-600 mb-6">
                Both partners have joined the room. You can now start uploading
                your personality images.
              </p>
              <Button variant="shadow">Start Personality Quiz</Button>
            </div>
          </div>
        )}

        {/* Room Info */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Room Information
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Room ID:</span>
              <span className="ml-2 font-mono">{room.room_id}</span>
            </div>
            <div>
              <span className="text-gray-500">Created:</span>
              <span className="ml-2">
                {new Date(room.created_at).toLocaleString("en-US", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>
              <span className="ml-2">
                {missingPartner
                  ? "Waiting for partner"
                  : "Both partners joined"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Expires:</span>
              <span className="ml-2">
                {new Date(
                  new Date(room.created_at).getTime() + 2.5 * 60 * 60 * 1000
                ).toLocaleString("en-US", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
