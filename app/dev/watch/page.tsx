import { getAllRooms, getAllRoomsIncludingExpired, Room } from "@/lib/dynamodb";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function DevWatchPage() {
  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
          <p className="text-muted-foreground">
            This page is only available in development mode.
          </p>
        </div>
      </div>
    );
  }

  const activeRooms = await getAllRooms();
  const allRooms = await getAllRoomsIncludingExpired();

  // console.log("activeRooms", activeRooms);
  // console.log("allRooms", allRooms);

  const formatTimestamp = (timestamp: string) => {
    const d = new Date(timestamp);
    return (
      <div>
        <div>{d.toLocaleDateString()}</div>
        <div>{d.toLocaleTimeString()}</div>
      </div>
    );
  };

  const formatBoolean = (value: boolean | undefined) => {
    if (value === undefined) return "-";
    return value ? "✅" : "❌";
  };

  const truncateText = (text: string | undefined, maxLength: number = 20) => {
    if (!text) return "-";
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  const isRoomExpired = (createdAt: string): boolean => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffInHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return diffInHours > 2.5;
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Development - Room Monitor</h1>
        <p className="text-muted-foreground">
          Total active rooms: {activeRooms.length} | Total rooms (including
          expired): {allRooms.length}
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableCaption className="bg-background my-0">
            List of all active rooms in the system
          </TableCaption>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>Room ID</TableHead>
              <TableHead>A Name</TableHead>
              <TableHead>B Name</TableHead>
              <TableHead>A Emoji</TableHead>
              <TableHead>B Emoji</TableHead>
              <TableHead>A Ready</TableHead>
              <TableHead>B Ready</TableHead>
              <TableHead>Animal</TableHead>
              <TableHead>Place</TableHead>
              <TableHead>Plant</TableHead>
              <TableHead>Season</TableHead>
              <TableHead>Hobby</TableHead>
              <TableHead>Food</TableHead>
              <TableHead>Colour</TableHead>
              <TableHead>Drink</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-muted">
            {activeRooms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={17} className="text-center py-8">
                  No rooms found
                </TableCell>
              </TableRow>
            ) : (
              activeRooms.map((room: Room) => (
                <TableRow
                  key={room.room_id}
                  className="bg-background/75 font-mono"
                >
                  <TableCell className="font-mono font-medium">
                    {room.room_id}
                  </TableCell>
                  <TableCell>{truncateText(room.a_name)}</TableCell>
                  <TableCell>{truncateText(room.b_name)}</TableCell>
                  <TableCell className="text-center text-lg">
                    {room.a_emoji || "-"}
                  </TableCell>
                  <TableCell className="text-center text-lg">
                    {room.b_emoji || "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {formatBoolean(room.a_ready)}
                  </TableCell>
                  <TableCell className="text-center">
                    {formatBoolean(room.b_ready)}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">
                        A: {truncateText(room.animal_a, 10)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        B: {truncateText(room.animal_b, 10)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">
                        A: {truncateText(room.place_a, 10)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        B: {truncateText(room.place_b, 10)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">
                        A: {truncateText(room.plant_a, 10)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        B: {truncateText(room.plant_b, 10)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">
                        A: {truncateText(room.season_a, 10)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        B: {truncateText(room.season_b, 10)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">
                        A: {truncateText(room.hobby_a, 10)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        B: {truncateText(room.hobby_b, 10)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">
                        A: {truncateText(room.food_a, 10)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        B: {truncateText(room.food_b, 10)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">
                        A: {truncateText(room.colour_a, 10)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        B: {truncateText(room.colour_b, 10)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">
                        A: {truncateText(room.drink_a, 10)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        B: {truncateText(room.drink_b, 10)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatTimestamp(room.created_at)}
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatTimestamp(room.updated_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-8 mb-6">
        <h2 className="text-2xl font-bold">All Rooms (Including Expired)</h2>
        <p className="text-muted-foreground">
          Complete database view - expired rooms marked with 🔴
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableCaption className="bg-background my-0">
            Complete list of all rooms in the database (newest first)
          </TableCaption>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Room ID</TableHead>
              <TableHead>A Name</TableHead>
              <TableHead>B Name</TableHead>
              <TableHead>A Emoji</TableHead>
              <TableHead>B Emoji</TableHead>
              <TableHead>A Ready</TableHead>
              <TableHead>B Ready</TableHead>
              <TableHead>Animal</TableHead>
              <TableHead>Place</TableHead>
              <TableHead>Plant</TableHead>
              <TableHead>Season</TableHead>
              <TableHead>Hobby</TableHead>
              <TableHead>Food</TableHead>
              <TableHead>Colour</TableHead>
              <TableHead>Drink</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-muted">
            {allRooms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={18} className="text-center py-8">
                  No rooms found
                </TableCell>
              </TableRow>
            ) : (
              allRooms.map((room: Room) => {
                const expired = isRoomExpired(room.created_at);
                return (
                  <TableRow
                    key={room.room_id}
                    className={`${
                      expired
                        ? "bg-red-50 dark:bg-red-950/20"
                        : "bg-background/75"
                    } font-mono`}
                  >
                    <TableCell className="text-center">
                      {expired ? "🔴" : "✅"}
                    </TableCell>
                    <TableCell className="font-mono font-medium">
                      {room.room_id}
                    </TableCell>
                    <TableCell>{truncateText(room.a_name)}</TableCell>
                    <TableCell>{truncateText(room.b_name)}</TableCell>
                    <TableCell className="text-center text-lg">
                      {room.a_emoji || "-"}
                    </TableCell>
                    <TableCell className="text-center text-lg">
                      {room.b_emoji || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatBoolean(room.a_ready)}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatBoolean(room.b_ready)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">
                          A: {truncateText(room.animal_a, 10)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          B: {truncateText(room.animal_b, 10)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">
                          A: {truncateText(room.place_a, 10)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          B: {truncateText(room.place_b, 10)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">
                          A: {truncateText(room.plant_a, 10)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          B: {truncateText(room.plant_b, 10)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">
                          A: {truncateText(room.season_a, 10)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          B: {truncateText(room.season_b, 10)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">
                          A: {truncateText(room.hobby_a, 10)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          B: {truncateText(room.hobby_b, 10)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">
                          A: {truncateText(room.food_a, 10)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          B: {truncateText(room.food_b, 10)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">
                          A: {truncateText(room.colour_a, 10)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          B: {truncateText(room.colour_b, 10)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">
                          A: {truncateText(room.drink_a, 10)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          B: {truncateText(room.drink_b, 10)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatTimestamp(room.created_at)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatTimestamp(room.updated_at)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
