import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default async function JoinRoomPage({ params }: PageProps) {
  const { roomId } = await params;
  // Redirect to the main join page with the room_id as a query parameter
  redirect(`/join?roomId=${roomId}`);
}
