import { redirect } from "next/navigation";

interface JoinRoomPageProps {
  params: { room_id: string };
}

export default function JoinRoomPage({ params }: JoinRoomPageProps) {
  // Redirect to the main join page with the room_id as a query parameter
  redirect(`/join?room_id=${params.room_id}`);
}
