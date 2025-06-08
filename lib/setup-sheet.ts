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
      range: "A1:AA1", // Extended range to include all 27 columns
    });

    const firstRow = response.data.values?.[0];

    // Expected headers with separate columns for each role and category
    const expectedHeaders = [
      "room_id",
      "girlfriend_name",
      "boyfriend_name",
      "girlfriend_emoji",
      "boyfriend_emoji",
      "animal_girlfriend",
      "animal_boyfriend",
      "place_girlfriend",
      "place_boyfriend",
      "plant_girlfriend",
      "plant_boyfriend",
      "character_girlfriend",
      "character_boyfriend",
      "season_girlfriend",
      "season_boyfriend",
      "hobby_girlfriend",
      "hobby_boyfriend",
      "food_girlfriend",
      "food_boyfriend",
      "colour_girlfriend",
      "colour_boyfriend",
      "drink_girlfriend",
      "drink_boyfriend",
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
        range: "A1:AA1", // Extended range for all 27 columns
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
