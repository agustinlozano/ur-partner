import { readSheetData } from "@/lib/sheets";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const spreadsheetId = process.env.SPREADSHEET_ID;

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: "SPREADSHEET_ID environment variable is not set" },
        { status: 500 }
      );
    }

    // Read all data starting from row 1 (includes headers)
    // We'll get the headers and data, then format it properly
    const rawData = await readSheetData(spreadsheetId, "A:C");

    if (!rawData || rawData.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // First row should be headers
    const headers = rawData[0];
    const dataRows = rawData.slice(1);

    // Transform the data into objects with proper field names
    const formattedData = dataRows.map((row) => ({
      session_id: row[0] || "",
      girlfriend_name: row[1] || "",
      boyfriend_name: row[2] || "",
    }));

    return NextResponse.json({
      data: formattedData,
      headers: headers,
      totalRows: rawData.length,
    });
  } catch (error) {
    console.error("API Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        error: errorMessage,
        details: "Check server logs for more information",
      },
      { status: 500 }
    );
  }
}
