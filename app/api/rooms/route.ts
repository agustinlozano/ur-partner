import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@vercel/firewall";
import { appendToSheet, generateRoomId, findRoomByRoomId } from "@/lib/sheets";

export interface CreateRoomInput {
  role: "girlfriend" | "boyfriend";
  name: string;
  emoji: string;
}

export interface CreateRoomResult {
  success: boolean;
  room_id?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  const { rateLimited } = await checkRateLimit("create-room", { request });
  if (rateLimited) {
    return NextResponse.json(
      {
        success: false,
        error: "Rate limit exceeded. Please try again later.",
      },
      {
        status: 429,
      }
    );
  }

  try {
    const body: CreateRoomInput = await request.json();

    const spreadsheetId = process.env.SPREADSHEET_ID;

    if (!spreadsheetId) {
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error: SPREADSHEET_ID not set",
        },
        { status: 500 }
      );
    }

    if (!body.name?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Name is required",
        },
        { status: 400 }
      );
    }

    if (!body.emoji?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Emoji is required",
        },
        { status: 400 }
      );
    }

    if (!body.role || !["girlfriend", "boyfriend"].includes(body.role)) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid role is required (girlfriend or boyfriend)",
        },
        { status: 400 }
      );
    }

    // Generate unique room ID
    let roomId = generateRoomId();
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure room ID is unique (check against existing rooms)
    while (attempts < maxAttempts) {
      const existingRoom = await findRoomByRoomId(roomId);
      if (!existingRoom) {
        break; // Room ID is unique
      }
      roomId = generateRoomId();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to generate unique room ID. Please try again.",
        },
        { status: 500 }
      );
    }

    // Prepare the row data (updated with separate role columns)
    const now = new Date().toISOString();
    const rowData = [
      roomId, // room_id
      body.role === "girlfriend" ? body.name : "", // girlfriend_name
      body.role === "boyfriend" ? body.name : "", // boyfriend_name
      body.role === "girlfriend" ? body.emoji : "", // girlfriend_emoji
      body.role === "boyfriend" ? body.emoji : "", // boyfriend_emoji
      "", // animal_girlfriend
      "", // animal_boyfriend
      "", // place_girlfriend
      "", // place_boyfriend
      "", // plant_girlfriend
      "", // plant_boyfriend
      "", // character_girlfriend
      "", // character_boyfriend
      "", // season_girlfriend
      "", // season_boyfriend
      "", // hobby_girlfriend
      "", // hobby_boyfriend
      "", // food_girlfriend
      "", // food_boyfriend
      "", // colour_girlfriend
      "", // colour_boyfriend
      "", // drink_girlfriend
      "", // drink_boyfriend
      "", // girlfriend_ready
      "", // boyfriend_ready
      now, // created_at
      now, // updated_at
    ];

    // Add to Google Sheet
    await appendToSheet(spreadsheetId, "A:AA", [rowData]);

    return NextResponse.json({
      success: true,
      room_id: roomId,
    });
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create room. Please try again.",
      },
      { status: 500 }
    );
  }
}
