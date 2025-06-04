import { googleAuth } from "./sheets";
import { google } from "googleapis";

export const setupSheetHeaders = async () => {
  try {
    const spreadsheetId = process.env.SPREADSHEET_ID;
    if (!spreadsheetId) {
      throw new Error("SPREADSHEET_ID not configured");
    }

    const auth = await googleAuth();
    const sheets = google.sheets({ version: "v4", auth });

    // Read the first row to check if headers exist
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "A1:P1",
    });

    const firstRow = response.data.values?.[0];

    // Expected headers according to project description
    const expectedHeaders = [
      "room_id",
      "girlfriend_name",
      "boyfriend_name",
      "animal",
      "place",
      "plant",
      "character",
      "season",
      "hobby",
      "food",
      "colour",
      "drink",
      "girlfriend_ready",
      "boyfriend_ready",
      "created_at",
      "updated_at",
    ];

    // If headers don't match, update them
    if (
      !firstRow ||
      firstRow.length !== expectedHeaders.length ||
      !expectedHeaders.every((header, index) => firstRow[index] === header)
    ) {
      console.log("Setting up sheet headers...");

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "A1:P1",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [expectedHeaders],
        },
      });

      console.log("Headers set up successfully!");
      return { success: true, message: "Headers configured" };
    }

    console.log("Headers already configured correctly");
    return { success: true, message: "Headers already configured" };
  } catch (error) {
    console.error("Error setting up sheet headers:", error);
    throw new Error("Failed to setup sheet headers");
  }
};
