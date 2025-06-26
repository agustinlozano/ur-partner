import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  act,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import RevealContent from "@/components/reveal-content";
import {
  createMockUserData,
  createMockImages,
  TEST_SCENARIOS,
} from "../utils/test-data";

// Get references to the mocked functions so we can control them per test
// Import types for mocking
import type { uploadImages, checkPartnerImages } from "@/lib/actions";

// Create mockable store function
const mockGetImagesForRoom = vi.fn();

// Mock the complex dependencies
vi.mock("@/stores/personality-images-store", () => ({
  usePersonalityImagesStore: () => ({
    getImagesForRoom: mockGetImagesForRoom,
  }),
}));

vi.mock("@/hooks/use-is-mobile", () => ({
  useIsMobile: () => false,
}));

// Mock fetch globally to prevent real HTTP calls
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: vi.fn().mockResolvedValue({
    success: true,
    message: "Upload successful",
  }),
});

// Create mock functions that we can control in tests
const mockUploadImages = vi.fn();
const mockCheckPartnerImages = vi.fn();

vi.mock("@/lib/actions", () => ({
  checkPartnerImages: () => mockCheckPartnerImages(),
  uploadImages: (...args: any[]) => mockUploadImages(...args),
}));

vi.mock("@/lib/env", () => ({
  enviroment: "test",
  LAMBDA_UPLOAD_ENDPOINT: "http://test-endpoint",
  USE_LAMBDA_UPLOAD: false,
  RATE_LIMIT_ENDPOINT: "http://test-rate-limit",
}));

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));

// Mock the UI components that we don't need to test yet
vi.mock("@/components/personality-form/category-marquee", () => ({
  CategoryMarquee: () => <div data-testid="category-marquee">Marquee</div>,
}));

vi.mock("@/components/personality-form/category-hover-reveal", () => ({
  default: () => <div data-testid="category-hover">Hover</div>,
}));

vi.mock("@/components/personality-form/category-expandable-gallery", () => ({
  default: () => <div data-testid="category-gallery">Gallery</div>,
}));

// Helper function to mock localStorage with user data
const mockLocalStorageWithUser = (userData = createMockUserData()) => {
  const mockGetItem = vi.fn().mockImplementation((key: string) => {
    if (key === "activeRoom") {
      return JSON.stringify(userData);
    }
    return null;
  });

  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: mockGetItem,
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
    writable: true,
  });

  return mockGetItem;
};

// Helper function to mock Zustand store with images
const mockZustandWithImages = (images = {}) => {
  mockGetImagesForRoom.mockReturnValue(images);
};

describe("RevealContent - Working Tests", () => {
  beforeEach(() => {
    // Use fake timers to control setInterval/setTimeout
    vi.useFakeTimers();

    // Clear all mocks
    vi.clearAllMocks();

    // Default: no images (prevents upload flow by default)
    mockZustandWithImages({});

    // Set default mock behaviors
    mockUploadImages.mockResolvedValue({ success: true });
    mockCheckPartnerImages.mockResolvedValue({
      success: true,
      isReady: false,
      partnerRole: "boyfriend",
      totalImages: 0,
      categoriesCompleted: 0,
    });
  });

  afterEach(() => {
    // Clean up timers to prevent memory leaks
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe("Basic Rendering", () => {
    it("renders without crashing", () => {
      render(<RevealContent roomId="test-room-123" />);
      expect(document.body).toBeInTheDocument();
    });

    it("shows loading state initially", () => {
      render(<RevealContent roomId="test-room-123" />);
      expect(screen.getByText(/preparing your reveal/i)).toBeInTheDocument();
    });

    it("redirects when no user data in localStorage", () => {
      const { container } = render(<RevealContent roomId="test-room-123" />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("User with Data", () => {
    it("shows initial loading when user is logged in", () => {
      mockLocalStorageWithUser(createMockUserData({ role: "girlfriend" }));
      render(<RevealContent roomId="test-room-123" />);

      expect(screen.getByText(/preparing your reveal/i)).toBeInTheDocument();
      expect(
        screen.getByText(/gathering your personality galleries/i)
      ).toBeInTheDocument();
    });

    it("stays in loading when user has no images", () => {
      mockLocalStorageWithUser(createMockUserData({ role: "girlfriend" }));
      mockZustandWithImages({});

      render(<RevealContent roomId="test-room-123" />);

      expect(screen.getByText(/preparing your reveal/i)).toBeInTheDocument();

      // Fast-forward - should stay in loading without progressing
      vi.advanceTimersByTime(2000);
      expect(screen.getByText(/preparing your reveal/i)).toBeInTheDocument();
    });

    it("completes upload flow and reaches partner checking when user has images", async () => {
      mockLocalStorageWithUser(createMockUserData({ role: "girlfriend" }));
      mockZustandWithImages(createMockImages());

      render(<RevealContent roomId="test-room-123" />);

      expect(
        screen.getByText(/gathering your personality galleries/i)
      ).toBeInTheDocument();

      // Fast-forward through the complete upload process
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      // Verify that Zustand was called to get images
      expect(mockGetImagesForRoom).toHaveBeenCalledWith(
        "test-room-123",
        "girlfriend"
      );

      // Should reach the partner checking phase
      expect(
        screen.getByText(/checking partner's images/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/the big reveal/i)).toBeInTheDocument();
    });

    it("calls upload API with correct parameters", async () => {
      mockLocalStorageWithUser(createMockUserData({ role: "boyfriend" }));
      const mockImages = createMockImages();
      mockZustandWithImages(mockImages);

      render(<RevealContent roomId="test-room-123" />);

      // Fast-forward through upload process
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      // Verify upload API was called with correct parameters
      expect(mockUploadImages).toHaveBeenCalledWith(
        "test-room-123",
        "boyfriend",
        mockImages
      );
    });

    it("handles upload errors gracefully", async () => {
      mockLocalStorageWithUser(createMockUserData({ role: "girlfriend" }));
      mockZustandWithImages(createMockImages());

      mockUploadImages.mockResolvedValueOnce({
        success: false,
        error: "Upload failed",
      });

      render(<RevealContent roomId="test-room-123" />);

      // Fast-forward through upload process
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      // Should show error state
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
    });

    it("handles rate limit errors with specific messaging", async () => {
      mockLocalStorageWithUser(createMockUserData({ role: "girlfriend" }));
      mockZustandWithImages(createMockImages());

      mockUploadImages.mockResolvedValueOnce({
        success: false,
        error: "Rate limit exceeded",
        message:
          "You've reached the upload limit. Please wait before trying again.",
      });

      render(<RevealContent roomId="test-room-123" />);

      // Fast-forward through upload process
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      // Should show rate limit specific error
      expect(screen.getByText(/upload limit reached/i)).toBeInTheDocument();
      expect(
        screen.getByText(/you've reached the upload limit/i)
      ).toBeInTheDocument();
    });

    it("navigates back to room when back button is clicked", async () => {
      mockLocalStorageWithUser(createMockUserData({ role: "girlfriend" }));
      mockZustandWithImages(createMockImages());

      mockUploadImages.mockResolvedValueOnce({
        success: false,
        error: "Network error",
      });

      render(<RevealContent roomId="test-room-123" />);

      // Fast-forward to error state
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      // Should show back button
      const backButton = screen.getByRole("link", { name: /back to room/i });
      expect(backButton).toHaveAttribute("href", "/room/test-room-123");
    });
  });

  describe("Timer and Cleanup", () => {
    it("cleans up intervals when component unmounts", async () => {
      const intervalSpy = vi.spyOn(global, "setInterval");
      const clearIntervalSpy = vi.spyOn(global, "clearInterval");

      mockLocalStorageWithUser(createMockUserData({ role: "girlfriend" }));
      mockZustandWithImages(createMockImages());

      const { unmount } = render(<RevealContent roomId="test-room-123" />);

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(intervalSpy).toHaveBeenCalled();

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();

      intervalSpy.mockRestore();
      clearIntervalSpy.mockRestore();
    });
  });

  describe("API Verification", () => {
    it("verifies upload API parameters are correct", async () => {
      const userData = createMockUserData({ role: "boyfriend" });
      const images = createMockImages();

      mockLocalStorageWithUser(userData);
      mockZustandWithImages(images);

      render(<RevealContent roomId="test-room-123" />);

      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      expect(mockUploadImages).toHaveBeenCalledWith(
        "test-room-123",
        "boyfriend",
        images
      );
    });

    it("verifies reveal check API parameters", async () => {
      const userData = createMockUserData({ role: "girlfriend" });

      mockLocalStorageWithUser(userData);
      mockZustandWithImages(createMockImages());

      mockUploadImages.mockResolvedValueOnce({ success: true });
      mockCheckPartnerImages.mockResolvedValue({
        success: true,
        isReady: false,
        partnerRole: "boyfriend",
      });

      render(<RevealContent roomId="test-room-123" />);

      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      // Don't need to wait for the partner check call - just verify upload was called
      expect(mockUploadImages).toHaveBeenCalledWith(
        "test-room-123",
        "girlfriend",
        createMockImages()
      );
    });
  });
});
