interface RevealReadyResponse {
  isReady: boolean;
  partnerRole: string;
  totalImages: number;
  categoriesCompleted: number;
  categoriesWithProgress?: number;
  error?: string;
}

export async function checkRevealReady(
  roomId: string,
  userSlot: string
): Promise<RevealReadyResponse> {
  try {
    const response = await fetch(
      `/api/room/${roomId}/partner-images?userSlot=${userSlot}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      return {
        isReady: data.isReady,
        partnerRole: data.partnerRole,
        totalImages: data.totalImages,
        categoriesCompleted: data.categoriesCompleted,
        categoriesWithProgress: data.categoriesCompleted,
      };
    } else {
      return {
        isReady: false,
        partnerRole: "",
        totalImages: 0,
        categoriesCompleted: 0,
        categoriesWithProgress: 0,
        error: data.error || "Failed to check reveal status",
      };
    }
  } catch (error) {
    console.error("Error checking reveal ready:", error);
    return {
      isReady: false,
      partnerRole: "",
      totalImages: 0,
      categoriesCompleted: 0,
      categoriesWithProgress: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function checkRevealReadyEnhanced(
  roomId: string,
  userSlot: string
): Promise<RevealReadyResponse> {
  try {
    const [statusResponse, imagesResponse] = await Promise.all([
      fetch(`/api/room/${roomId}/partner-status?slot=${userSlot}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }),
      fetch(`/api/room/${roomId}/partner-images?userSlot=${userSlot}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }),
    ]);

    if (!statusResponse.ok || !imagesResponse.ok) {
      throw new Error(
        `HTTP error! status: ${statusResponse.status} / ${imagesResponse.status}`
      );
    }

    const [statusData, imagesData] = await Promise.all([
      statusResponse.json(),
      imagesResponse.json(),
    ]);

    if (statusData.success && imagesData.success) {
      const categoriesWithProgress = statusData.progress.completed.length;
      const categoriesCompleted = imagesData.categoriesCompleted;
      const totalImages = imagesData.totalImages;

      const isReady = categoriesCompleted >= 9;

      console.log("🔍 Temporal flow check:", {
        roomId,
        userSlot,
        categoriesWithProgress,
        categoriesCompleted,
        totalImages,
        isTemporalFlowValid: categoriesWithProgress >= categoriesCompleted,
        isReady,
      });

      return {
        isReady,
        partnerRole: imagesData.partnerRole,
        totalImages,
        categoriesCompleted,
        categoriesWithProgress,
      };
    } else {
      throw new Error(
        statusData.error || imagesData.error || "Failed to check reveal status"
      );
    }
  } catch (error) {
    console.error("Error checking enhanced reveal ready:", error);
    return checkRevealReady(roomId, userSlot);
  }
}
