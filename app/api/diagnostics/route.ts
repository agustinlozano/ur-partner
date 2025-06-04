import { googleAuth } from "@/lib/sheets";
import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
    const spreadsheetId = process.env.SPREADSHEET_ID;

    const diagnostics = {
      environmentVariables: {
        hasEmail: !!clientEmail,
        hasPrivateKey: !!privateKey,
        hasSpreadsheetId: !!spreadsheetId,
      },
      serviceAccountEmail: clientEmail || null,
      spreadsheetId: spreadsheetId || null,
      authenticationTest: null as any,
      permissionTest: null as any,
    };

    // Test authentication
    try {
      const auth = await googleAuth();
      diagnostics.authenticationTest = {
        success: true,
        message: "Authentication successful",
      };

      // Test basic read permission
      if (spreadsheetId) {
        try {
          const sheets = google.sheets({ version: "v4", auth });
          const response = await sheets.spreadsheets.get({
            spreadsheetId,
          });

          diagnostics.permissionTest = {
            success: true,
            message: "Can access spreadsheet",
            spreadsheetTitle: response.data.properties?.title || "Unknown",
          };

          // Test read permission
          try {
            await sheets.spreadsheets.values.get({
              spreadsheetId,
              range: "A1:A1",
            });
            diagnostics.permissionTest.canRead = true;
          } catch (readError) {
            diagnostics.permissionTest.canRead = false;
            diagnostics.permissionTest.readError =
              readError instanceof Error
                ? readError.message
                : "Unknown read error";
          }

          // Test write permission (try to read first, then append a test row)
          try {
            // First check if we can append (this will fail with 403 if no write permission)
            await sheets.spreadsheets.values.append({
              spreadsheetId,
              range: "A:A",
              valueInputOption: "USER_ENTERED",
              requestBody: {
                values: [["DIAGNOSTIC_TEST_" + Date.now()]],
              },
            });
            diagnostics.permissionTest.canWrite = true;

            // Clean up - remove the test row we just added
            try {
              const readResponse = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: "A:A",
              });
              const values = readResponse.data.values || [];
              const lastRowIndex = values.length;

              if (
                values[lastRowIndex - 1] &&
                values[lastRowIndex - 1][0]?.startsWith("DIAGNOSTIC_TEST_")
              ) {
                await sheets.spreadsheets.values.clear({
                  spreadsheetId,
                  range: `A${lastRowIndex}:A${lastRowIndex}`,
                });
              }
            } catch (cleanupError) {
              // Cleanup failed, but that's okay for diagnostics
            }
          } catch (writeError: any) {
            diagnostics.permissionTest.canWrite = false;
            diagnostics.permissionTest.writeError =
              writeError.message || "Unknown write error";
            diagnostics.permissionTest.writeErrorCode =
              writeError.code || "Unknown";
          }
        } catch (spreadsheetError: any) {
          diagnostics.permissionTest = {
            success: false,
            message: "Cannot access spreadsheet",
            error: spreadsheetError.message || "Unknown error",
            errorCode: spreadsheetError.code || "Unknown",
          };
        }
      }
    } catch (authError: any) {
      diagnostics.authenticationTest = {
        success: false,
        message: "Authentication failed",
        error: authError.message || "Unknown error",
      };
    }

    return NextResponse.json(diagnostics);
  } catch (error) {
    console.error("Diagnostics error:", error);

    return NextResponse.json(
      {
        error: "Diagnostics failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
