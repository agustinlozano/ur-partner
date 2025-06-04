"use client";

import { useState, useEffect } from "react";

interface SheetData {
  session_id: string;
  girlfriend_name: string;
  boyfriend_name: string;
}

export default function SheetTest() {
  const [data, setData] = useState<SheetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);

  const fetchSheetData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/sheets");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setData(result.data || []);
    } catch (err) {
      console.error("Error fetching sheet data:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const setupSheet = async () => {
    try {
      setSetupLoading(true);
      const response = await fetch("/api/setup", { method: "POST" });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      // After setup, refresh the data
      await fetchSheetData();
    } catch (err) {
      console.error("Error setting up sheet:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSetupLoading(false);
    }
  };

  useEffect(() => {
    fetchSheetData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">
          Testing Google Sheets Connection
        </h2>
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span>Loading sheet data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4 text-red-600">
          Error Testing Google Sheets
        </h2>
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>

        <div className="mb-4">
          <button
            onClick={setupSheet}
            disabled={setupLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mr-2"
          >
            {setupLoading ? "Setting up..." : "Setup Sheet Headers"}
          </button>
          <button
            onClick={fetchSheetData}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Retry
          </button>
        </div>

        <div className="text-sm text-gray-600">
          <p>Make sure you have:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>GOOGLE_SERVICE_ACCOUNT_EMAIL environment variable set</li>
            <li>GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY environment variable set</li>
            <li>SPREADSHEET_ID environment variable set</li>
            <li>The service account has access to the spreadsheet</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-green-600">
        ✅ Google Sheets Connection Test
      </h2>

      <div className="mb-4">
        <button
          onClick={setupSheet}
          disabled={setupLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mr-2"
        >
          {setupLoading ? "Setting up..." : "Setup/Update Headers"}
        </button>
        <button
          onClick={fetchSheetData}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
        >
          Refresh Data
        </button>
      </div>

      {data.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <p className="text-yellow-700">
            No data found in the sheet (or only headers).
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-600">Found {data.length} row(s) of data:</p>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">
                    Session ID
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left">
                    Girlfriend Name
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left">
                    Boyfriend Name
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="border border-gray-300 px-4 py-2">
                      {row.session_id || "—"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {row.girlfriend_name || "—"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {row.boyfriend_name || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        <p>
          This component is reading from your Google Sheet. Click "Setup/Update
          Headers" to configure the correct room structure.
        </p>
      </div>
    </div>
  );
}
