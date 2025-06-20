import { getAllRooms, Room } from "@/lib/dynamodb";
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

  const rooms = await getAllRooms();

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

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Development - Room Monitor</h1>
        <p className="text-muted-foreground">
          Total active rooms: {rooms.length}
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
              <TableHead>GF Name</TableHead>
              <TableHead>BF Name</TableHead>
              <TableHead>GF Emoji</TableHead>
              <TableHead>BF Emoji</TableHead>
              <TableHead>GF Ready</TableHead>
              <TableHead>BF Ready</TableHead>
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
            {rooms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={17} className="text-center py-8">
                  No rooms found
                </TableCell>
              </TableRow>
            ) : (
              rooms.map((room: Room) => (
                <TableRow
                  key={room.room_id}
                  className="bg-background/75 font-mono"
                >
                  <TableCell className="font-mono font-medium">
                    {room.room_id}
                  </TableCell>
                  <TableCell>{truncateText(room.girlfriend_name)}</TableCell>
                  <TableCell>{truncateText(room.boyfriend_name)}</TableCell>
                  <TableCell className="text-center text-lg">
                    {room.girlfriend_emoji || "-"}
                  </TableCell>
                  <TableCell className="text-center text-lg">
                    {room.boyfriend_emoji || "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {formatBoolean(room.girlfriend_ready)}
                  </TableCell>
                  <TableCell className="text-center">
                    {formatBoolean(room.boyfriend_ready)}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">
                        GF: {truncateText(room.animal_girlfriend, 10)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        BF: {truncateText(room.animal_boyfriend, 10)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">
                        GF: {truncateText(room.place_girlfriend, 10)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        BF: {truncateText(room.place_boyfriend, 10)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">
                        GF: {truncateText(room.plant_girlfriend, 10)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        BF: {truncateText(room.plant_boyfriend, 10)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">
                        GF: {truncateText(room.season_girlfriend, 10)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        BF: {truncateText(room.season_boyfriend, 10)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">
                        GF: {truncateText(room.hobby_girlfriend, 10)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        BF: {truncateText(room.hobby_boyfriend, 10)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">
                        GF: {truncateText(room.food_girlfriend, 10)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        BF: {truncateText(room.food_boyfriend, 10)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">
                        GF: {truncateText(room.colour_girlfriend, 10)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        BF: {truncateText(room.colour_boyfriend, 10)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">
                        GF: {truncateText(room.drink_girlfriend, 10)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        BF: {truncateText(room.drink_boyfriend, 10)}
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
    </div>
  );
}
