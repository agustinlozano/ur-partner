import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ room_id: string }>;
}

export default async function JoinRoomPage({ params }: PageProps) {
  const { room_id } = await params;
  // Redirect to the main join page with the room_id as a query parameter
  redirect(`/join?roomId=${room_id}`);
}
