// Test data factories using real images from public/cele-partner

export const createMockUserData = (overrides: any = {}) => ({
  role: "girlfriend" as const,
  name: "Test User",
  emoji: "😊",
  ...overrides,
});

export const createMockImages = (overrides: any = {}) => ({
  character: [
    "/cele-partner/character-heidi.webp",
    "/cele-partner/character-dee-dee.webp",
  ],
  animal: ["/cele-partner/animal.webp"],
  food: ["/cele-partner/food.jpg"],
  drink: ["/cele-partner/drink.png"],
  color: ["/cele-partner/color.jpg"],
  hobby: ["/cele-partner/hobby.jpg"],
  place: ["/cele-partner/place.jpg"],
  plant: ["/cele-partner/plant.jpg"],
  season: ["/cele-partner/season.webp"],
  ...overrides,
});

export const createMockPartnerImagesResponse = (overrides: any = {}) => ({
  success: true,
  isReady: true,
  images: createMockImages(),
  partnerRole: "boyfriend",
  totalImages: 9,
  categoriesCompleted: 9,
  ...overrides,
});

export const createMockUploadResponse = (overrides: any = {}) => ({
  success: true,
  message: "Images uploaded successfully",
  ...overrides,
});

// Mock data for different test scenarios
export const TEST_SCENARIOS = {
  HAPPY_PATH: {
    userData: createMockUserData(),
    images: createMockImages(),
    partnerResponse: createMockPartnerImagesResponse(),
  },
  NO_USER_DATA: {
    userData: null,
    images: {},
    partnerResponse: { success: false, error: "No user found" },
  },
  PARTNER_NOT_READY: {
    userData: createMockUserData(),
    images: createMockImages(),
    partnerResponse: createMockPartnerImagesResponse({
      isReady: false,
      categoriesCompleted: 5,
      totalImages: 5,
    }),
  },
  UPLOAD_ERROR: {
    userData: createMockUserData(),
    images: createMockImages(),
    uploadResponse: createMockUploadResponse({
      success: false,
      error: "Upload failed",
    }),
  },
};
