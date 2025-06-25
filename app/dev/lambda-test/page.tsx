"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Send, Trash2, CheckCircle, XCircle } from "lucide-react";
import Image from "next/image";
import { predefinedImages } from "@/lib/personality-form-constants";

interface TestResponse {
  success: boolean;
  message: string;
  roomId?: string;
  userRole?: string;
  uploadCount?: number;
  totalImages?: number;
  uploadedUrls?: { [categoryId: string]: string | string[] };
  error?: string;
  timestamp: string;
}

// Valid categories matching the Lambda and route.ts
const VALID_CATEGORIES = [
  "animal",
  "place",
  "plant",
  "character",
  "season",
  "hobby",
  "food",
  "colour",
  "drink",
];

export default function LambdaTestPage() {
  const [roomId, setRoomId] = useState("test-room-" + Date.now());
  const [userRole, setUserRole] = useState("player1");
  const [selectedImages, setSelectedImages] = useState<{
    [categoryId: string]: string | string[];
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [responses, setResponses] = useState<TestResponse[]>([]);

  // Load predefined images organized by category
  const loadPredefinedImages = () => {
    const images: { [categoryId: string]: string | string[] } = {};

    // Map predefined images to valid categories
    const categoryMapping: { [key: string]: string } = {
      animals: "animal",
      places: "place",
      plants: "plant",
      characters: "character",
      seasons: "season",
      hobbies: "hobby",
      foods: "food",
      colours: "colour",
      drinks: "drink",
    };

    Object.entries(predefinedImages).forEach(([key, categoryImages]) => {
      const mappedCategory = categoryMapping[key];
      if (mappedCategory && VALID_CATEGORIES.includes(mappedCategory)) {
        if (Array.isArray(categoryImages)) {
          // For character category, always use as array
          if (mappedCategory === "character") {
            images[mappedCategory] = categoryImages.slice(0, 3); // Max 3 for testing
          } else {
            // For other categories, take first image only as single string
            images[mappedCategory] = categoryImages[0] || "";
          }
        } else if (categoryImages) {
          // Character category should always be array, even for single image
          if (mappedCategory === "character") {
            images[mappedCategory] = [categoryImages];
          } else {
            images[mappedCategory] = categoryImages;
          }
        }
      }
    });

    // Add some demo categories if predefined images don't cover all
    if (!images.animal) images.animal = "";
    if (!images.place) images.place = "";
    if (!images.plant) images.plant = "";

    setSelectedImages(images);
  };

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    category: string
  ) => {
    const files = event.target.files;
    if (!files) return;

    const file = files[0]; // Take only first file for simplicity
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        // Remove data:image/...;base64, prefix
        const base64 = result.split(",")[1];
        setSelectedImages((prev) => ({
          ...prev,
          [category]: base64,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const sendToLambda = async () => {
    // Filter out empty categories
    const filteredImages = Object.fromEntries(
      Object.entries(selectedImages).filter(([_, imageData]) => {
        if (Array.isArray(imageData)) {
          return (
            imageData.length > 0 && imageData.some((img) => img.trim() !== "")
          );
        }
        return typeof imageData === "string" && imageData.trim() !== "";
      })
    );

    if (Object.keys(filteredImages).length === 0) {
      alert("Please select some images first!");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        roomId: roomId,
        userRole: userRole,
        images: filteredImages,
      };

      console.log("Sending payload:", payload);

      const response = await fetch(`/api/room/${roomId}/upload-images`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      const testResponse: TestResponse = {
        success: response.ok && data.success,
        message: data.message || data.error || "Unknown response",
        roomId: data.roomId,
        userRole: data.userRole,
        uploadCount: data.uploadCount,
        totalImages: data.totalImages,
        uploadedUrls: data.uploadedUrls,
        error: response.ok ? undefined : data.error,
        timestamp: new Date().toLocaleTimeString(),
      };

      setResponses((prev) => [testResponse, ...prev]);

      if (response.ok && data.success) {
        console.log("✅ Success:", data);
      } else {
        console.error("❌ Error:", data);
      }
    } catch (error) {
      console.error("❌ Network error:", error);
      const testResponse: TestResponse = {
        success: false,
        message: "Network error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toLocaleTimeString(),
      };
      setResponses((prev) => [testResponse, ...prev]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearImages = () => {
    setSelectedImages({});
  };

  const clearResponses = () => {
    setResponses([]);
  };

  const removeCategory = (category: string) => {
    setSelectedImages((prev) => {
      const newImages = { ...prev };
      delete newImages[category];
      return newImages;
    });
  };

  const addCategory = (category: string) => {
    if (!selectedImages[category]) {
      setSelectedImages((prev) => ({
        ...prev,
        // Character category is always an array
        [category]: category === "character" ? [] : "",
      }));
    }
  };

  const getTotalImageCount = () => {
    return Object.values(selectedImages).reduce((total, imageData) => {
      if (Array.isArray(imageData)) {
        return total + imageData.filter((img) => img.trim() !== "").length;
      }
      return (
        total +
        (typeof imageData === "string" && imageData.trim() !== "" ? 1 : 0)
      );
    }, 0);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🧪 API Upload Test (with Rate Limiting)
              <span className="text-sm font-normal text-muted-foreground">
                Testing via Next.js API route with rate limiting + lambda proxy
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Room ID
                </label>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  placeholder="test-room-123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  User Role
                </label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                >
                  <option value="player1">player1</option>
                  <option value="player2">player2</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={loadPredefinedImages} variant="secondary">
                ✨ Load Demo Images
              </Button>

              <Button
                onClick={clearImages}
                variant="destructive"
                disabled={Object.keys(selectedImages).length === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Category Management */}
        <Card>
          <CardHeader>
            <CardTitle>Add Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {VALID_CATEGORIES.map((category) => (
                <Button
                  key={category}
                  onClick={() => addCategory(category)}
                  variant={selectedImages[category] ? "default" : "outline"}
                  size="sm"
                  disabled={!!selectedImages[category]}
                >
                  {category}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Selected Images by Category */}
        {Object.keys(selectedImages).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                Selected Images by Category ({getTotalImageCount()} total)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(selectedImages).map(([category, imageData]) => (
                <div
                  key={category}
                  className="border border-border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium capitalize">{category}</h3>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeCategory(category)}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>

                  {Array.isArray(imageData) ? (
                    <div className="space-y-4">
                      {/* Show existing images */}
                      {imageData.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {imageData.map(
                            (image, index) =>
                              image && (
                                <div
                                  key={index}
                                  className="aspect-square relative border border-border rounded-md overflow-hidden group"
                                >
                                  <Image
                                    src={`data:image/jpeg;base64,${image}`}
                                    alt={`${category} ${index + 1}`}
                                    fill
                                    className="object-cover"
                                  />
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                      setSelectedImages((prev) => ({
                                        ...prev,
                                        [category]: Array.isArray(
                                          prev[category]
                                        )
                                          ? (prev[category] as string[]).filter(
                                              (_, i) => i !== index
                                            )
                                          : prev[category],
                                      }));
                                    }}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </div>
                              )
                          )}
                        </div>
                      )}

                      {/* Add new image button for character category */}
                      {imageData.length < 5 && (
                        <div className="relative">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              document
                                .getElementById(`file-input-${category}`)
                                ?.click()
                            }
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Add {category} Image ({imageData.length}/5)
                          </Button>
                          <input
                            id={`file-input-${category}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const files = e.target.files;
                              if (!files) return;

                              const file = files[0];
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const result = event.target?.result as string;
                                if (result) {
                                  const base64 = result.split(",")[1];
                                  setSelectedImages((prev) => ({
                                    ...prev,
                                    [category]: Array.isArray(prev[category])
                                      ? [
                                          ...(prev[category] as string[]),
                                          base64,
                                        ]
                                      : [base64],
                                  }));
                                }
                              };
                              reader.readAsDataURL(file);
                              e.target.value = "";
                            }}
                            className="hidden"
                          />
                        </div>
                      )}

                      {imageData.length === 0 && (
                        <div className="text-sm text-muted-foreground">
                          No {category} images selected. You can add up to 5
                          images.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {imageData ? (
                        <div className="aspect-square w-32 relative border border-border rounded-md overflow-hidden">
                          <Image
                            src={`data:image/jpeg;base64,${imageData}`}
                            alt={category}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          No image selected
                        </div>
                      )}

                      <div className="relative">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            document
                              .getElementById(`file-input-${category}`)
                              ?.click()
                          }
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Image
                        </Button>
                        <input
                          id={`file-input-${category}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, category)}
                          className="hidden"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Send Button */}
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={sendToLambda}
              disabled={isLoading || getTotalImageCount() === 0}
              size="lg"
              className="w-full"
              variant="default"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send to Lambda ({getTotalImageCount()} images in{" "}
                  {Object.keys(selectedImages).length} categories)
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Responses */}
        {responses.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Test Responses</CardTitle>
              <Button onClick={clearResponses} variant="outline" size="sm">
                Clear History
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {responses.map((response, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-md border ${
                    response.success
                      ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                      : "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {response.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">
                          {response.success ? "Success" : "Error"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {response.timestamp}
                        </span>
                      </div>
                      <p className="text-sm mb-2">{response.message}</p>

                      {response.success && (
                        <div className="space-y-2 text-xs">
                          <p>
                            <strong>Room:</strong> {response.roomId}
                          </p>
                          <p>
                            <strong>User:</strong> {response.userRole}
                          </p>
                          <p>
                            <strong>Uploaded:</strong> {response.uploadCount}/
                            {response.totalImages} images
                          </p>
                        </div>
                      )}

                      {response.uploadedUrls && (
                        <div className="space-y-1 mt-2">
                          <p className="text-xs font-medium">
                            Uploaded URLs by Category:
                          </p>
                          {Object.entries(response.uploadedUrls).map(
                            ([category, urls]) => (
                              <div key={category} className="text-xs">
                                <strong className="capitalize">
                                  {category}:
                                </strong>
                                {Array.isArray(urls) ? (
                                  <ul className="ml-4 list-disc">
                                    {urls.map((url, i) => (
                                      <li key={i}>
                                        <a
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline truncate"
                                        >
                                          {url.split("/").pop()}
                                        </a>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <a
                                    href={urls}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline ml-2"
                                  >
                                    {urls.split("/").pop()}
                                  </a>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      )}

                      {response.error && (
                        <p className="text-xs text-red-600 mt-1">
                          Error: {response.error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>API Endpoint:</strong> /api/room/{`{roomId}`}
                /upload-images
              </p>
              <p>
                <strong>Method:</strong> POST
              </p>
              <p>
                <strong>Features:</strong> Rate limiting + Lambda proxy
              </p>
              <p>
                <strong>Payload:</strong>{" "}
                {`{ userRole: string, images: { [categoryId]: string | string[] } }`}
              </p>
              <p>
                <strong>Valid Categories:</strong> {VALID_CATEGORIES.join(", ")}
              </p>
              <p>
                <strong>Rate Limiting:</strong> Configured per IP + service
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
