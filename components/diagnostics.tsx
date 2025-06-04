"use client";

import { useState } from "react";

export default function Diagnostics() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/diagnostics");
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: "Failed to run diagnostics" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🔍 Google Sheets Diagnostics
      </h3>

      <button
        onClick={runDiagnostics}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-4"
      >
        {loading ? "Running..." : "Run Diagnostics"}
      </button>

      {result && (
        <div className="mt-4">
          <h4 className="font-medium text-gray-900 mb-2">Results:</h4>
          <div className="bg-gray-50 rounded p-4 overflow-auto">
            <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
          </div>

          {result.environmentVariables && (
            <div className="mt-4">
              <h5 className="font-medium text-gray-900 mb-2">
                Environment Status:
              </h5>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className={
                      result.environmentVariables.hasEmail
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {result.environmentVariables.hasEmail ? "✅" : "❌"}
                  </span>
                  <span>GOOGLE_SERVICE_ACCOUNT_EMAIL</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      result.environmentVariables.hasPrivateKey
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {result.environmentVariables.hasPrivateKey ? "✅" : "❌"}
                  </span>
                  <span>GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      result.environmentVariables.hasSpreadsheetId
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {result.environmentVariables.hasSpreadsheetId ? "✅" : "❌"}
                  </span>
                  <span>SPREADSHEET_ID</span>
                </div>
              </div>
            </div>
          )}

          {result.serviceAccountEmail && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
              <h5 className="font-medium text-blue-900 mb-2">
                📧 Service Account Email:
              </h5>
              <code className="text-sm bg-white px-2 py-1 rounded border">
                {result.serviceAccountEmail}
              </code>
              <p className="text-sm text-blue-700 mt-2">
                Make sure your Google Sheet is shared with this email address as
                an Editor.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
