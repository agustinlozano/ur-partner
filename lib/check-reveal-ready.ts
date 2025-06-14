interface RevealReadyResponse {
  isReady: boolean;
  partnerRole: string;
  totalImages: number;
  categoriesCompleted: number;
  error?: string;
}

export async function checkRevealReady(
  roomId: string,
  userRole: string
): Promise<RevealReadyResponse> {
  try {
    const response = await fetch(
      `/api/room/${roomId}/partner-images?userRole=${userRole}`,
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
      };
    } else {
      return {
        isReady: false,
        partnerRole: "",
        totalImages: 0,
        categoriesCompleted: 0,
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
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
