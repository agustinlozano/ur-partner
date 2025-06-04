import { google } from "googleapis";

export const googleAuth = async () => {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  );

  if (!clientEmail || !privateKey) {
    throw new Error("Missing Google credentials.");
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/spreadsheets",
    ],
  });
};

export const readSheetData = async (spreadsheetId: string, range: string) => {
  try {
    const auth = await googleAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    return response.data.values || [];
  } catch (error) {
    console.error("Error reading sheet data:", error);
    throw new Error("Failed to read sheet data");
  }
};

export const appendToSheet = async (
  spreadsheetId: string,
  range: string,
  values: any[][]
) => {
  try {
    const auth = await googleAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error appending to sheet:", error);
    throw new Error("Failed to append data to sheet");
  }
};

export const updateSheetRow = async (
  spreadsheetId: string,
  range: string,
  values: any[][]
) => {
  try {
    const auth = await googleAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error updating sheet row:", error);
    throw new Error("Failed to update sheet data");
  }
};

export const generateRoomId = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

export const isRoomExpired = (createdAt: string) => {
  const created = new Date(createdAt);
  const now = new Date();
  const diffInHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
  return diffInHours > 2.5;
};

export const findRoomByRoomId = async (roomId: string) => {
  try {
    const spreadsheetId = process.env.SPREADSHEET_ID;
    if (!spreadsheetId) {
      throw new Error("SPREADSHEET_ID not configured");
    }

    const data = await readSheetData(spreadsheetId, "A:R"); // Extended to include emoji columns

    if (!data || data.length <= 1) {
      return null;
    }

    // Find the row with matching room_id (assuming room_id is in column A)
    const roomRow = data.find((row, index) => {
      if (index === 0) return false; // Skip header row
      return row[0] === roomId;
    });

    if (!roomRow) {
      return null;
    }

    // Map the row data to room object (updated with emoji columns)
    const room = {
      room_id: roomRow[0] || "",
      girlfriend_name: roomRow[1] || "",
      boyfriend_name: roomRow[2] || "",
      girlfriend_emoji: roomRow[3] || "💕", // Default emoji if not set
      boyfriend_emoji: roomRow[4] || "💙", // Default emoji if not set
      animal: roomRow[5] || "",
      place: roomRow[6] || "",
      plant: roomRow[7] || "",
      character: roomRow[8] || "",
      season: roomRow[9] || "",
      hobby: roomRow[10] || "",
      food: roomRow[11] || "",
      colour: roomRow[12] || "",
      drink: roomRow[13] || "",
      girlfriend_ready: roomRow[14] || "",
      boyfriend_ready: roomRow[15] || "",
      created_at: roomRow[16] || "",
      updated_at: roomRow[17] || "",
    };

    // Check if room is expired
    if (room.created_at && isRoomExpired(room.created_at)) {
      return null;
    }

    return room;
  } catch (error) {
    console.error("Error finding room:", error);
    throw new Error("Failed to find room");
  }
};
