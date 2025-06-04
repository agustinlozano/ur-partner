"use client";

import { useState } from "react";
import { createRoomAndRedirect } from "@/lib/actions";
import { Button } from "./ui/button";

export default function CreateRoom() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await createRoomAndRedirect(formData);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create a Room</h1>
        <p className="text-gray-600 mt-2">
          Start your personality sharing journey with your partner
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Your Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Enter your name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Your Role in the Relationship
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="role"
                value="girlfriend"
                required
                disabled={isLoading}
                className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 disabled:cursor-not-allowed"
              />
              <span className="ml-2 text-sm text-gray-700">Girlfriend 💕</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="role"
                value="boyfriend"
                required
                disabled={isLoading}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 disabled:cursor-not-allowed"
              />
              <span className="ml-2 text-sm text-gray-700">Boyfriend 💙</span>
            </label>
          </div>
        </div>

        <Button
          type="submit"
          variant="shadow"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Creating Room...
            </div>
          ) : (
            "Create Room"
          )}
        </Button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-blue-500">ℹ️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Room Information
            </h3>
            <div className="mt-1 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Rooms expire after 2.5 hours</li>
                <li>Share the room ID with your partner</li>
                <li>Both partners upload 9 personality images</li>
                <li>Images are revealed when both are ready</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
