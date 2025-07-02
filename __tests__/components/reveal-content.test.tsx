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

// Import types for type checking
import type { UploadImagesResult, PartnerImagesResult } from "@/lib/actions";

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
const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: vi.fn().mockResolvedValue({
    success: true,
    message: "Upload successful",
  }),
});

global.fetch = mockFetch;

// Also mock any HTTP client modules that might be used
vi.mock("http", () => ({
  request: vi.fn(),
  get: vi.fn(),
}));

vi.mock("https", () => ({
  request: vi.fn(),
  get: vi.fn(),
}));

// Since uploadImages and checkPartnerImages are now inside the component,
// we'll rely on the fetch mock to control their behavior

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

    // Reset fetch mock
    mockFetch.mockClear();

    // Default: no images (prevents upload flow by default)
    mockZustandWithImages({});

    // Set default fetch responses for upload and partner check
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/upload-images")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              success: true,
              message: "Upload successful",
            }),
        });
      } else if (url.includes("/partner-images")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              success: true,
              isReady: false,
              partnerRole: "roommate",
              totalImages: 0,
              categoriesCompleted: 0,
            }),
        });
      }
      // Default response
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      });
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
      mockLocalStorageWithUser(createMockUserData({ slot: "a" }));
      render(<RevealContent roomId="test-room-123" />);

      expect(screen.getByText(/preparing your reveal/i)).toBeInTheDocument();
      expect(
        screen.getByText(/gathering your personality galleries/i)
      ).toBeInTheDocument();
    });

    it("stays in loading when user has no images", () => {
      mockLocalStorageWithUser(createMockUserData({ slot: "b" }));
      mockZustandWithImages({});

      render(<RevealContent roomId="test-room-123" />);

      expect(screen.getByText(/preparing your reveal/i)).toBeInTheDocument();

      // Fast-forward - should stay in loading without progressing
      vi.advanceTimersByTime(2000);
      expect(screen.getByText(/preparing your reveal/i)).toBeInTheDocument();
    });

    it("completes upload flow and reaches partner checking when user has images", async () => {
      mockLocalStorageWithUser(createMockUserData({ slot: "a" }));
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
      expect(mockGetImagesForRoom).toHaveBeenCalledWith("test-room-123", "a");

      // Should reach the partner checking phase
      expect(
        screen.getByText(/checking partner's images/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/the big reveal/i)).toBeInTheDocument();
    });

    it("calls upload API with correct parameters", async () => {
      mockLocalStorageWithUser(createMockUserData({ slot: "b" }));
      const mockImages = createMockImages();
      mockZustandWithImages(mockImages);

      render(<RevealContent roomId="test-room-123" />);

      // Fast-forward through upload process
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      // Verify fetch was called with upload endpoint
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/room/test-room-123/upload-images",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userSlot: "b",
            images: mockImages,
          }),
        })
      );
    });

    it("handles upload errors gracefully", async () => {
      mockLocalStorageWithUser(createMockUserData({ slot: "a" }));
      mockZustandWithImages(createMockImages());

      // Configure fetch to return error for upload
      mockFetch.mockImplementationOnce((url: string) => {
        if (url.includes("/upload-images")) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
              Promise.resolve({
                success: false,
                error: "Upload failed",
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true }),
        });
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
      mockLocalStorageWithUser(createMockUserData({ slot: "a" }));
      mockZustandWithImages(createMockImages());

      // Configure fetch to return rate limit error
      mockFetch.mockImplementationOnce((url: string) => {
        if (url.includes("/upload-images")) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
              Promise.resolve({
                success: false,
                error: "Rate limit exceeded",
                message:
                  "You've reached the upload limit. Please wait before trying again.",
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true }),
        });
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
      mockLocalStorageWithUser(createMockUserData({ slot: "a" }));
      mockZustandWithImages(createMockImages());

      // Configure fetch to return network error
      mockFetch.mockImplementationOnce((url: string) => {
        if (url.includes("/upload-images")) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
              Promise.resolve({
                success: false,
                error: "Network error",
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true }),
        });
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

      mockLocalStorageWithUser(createMockUserData({ slot: "a" }));
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
      const userData = createMockUserData({ slot: "b" });
      const images = createMockImages();

      mockLocalStorageWithUser(userData);
      mockZustandWithImages(images);

      render(<RevealContent roomId="test-room-123" />);

      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      // Verify fetch was called with correct upload parameters
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/room/test-room-123/upload-images",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userSlot: "b",
            images: images,
          }),
        })
      );
    });

    it("verifies reveal check API parameters", async () => {
      const userData = createMockUserData({ slot: "a" });

      mockLocalStorageWithUser(userData);
      mockZustandWithImages(createMockImages());

      render(<RevealContent roomId="test-room-123" />);

      await act(async () => {
        vi.advanceTimersByTime(5000); // Wait for upload to complete and partner check to start
      });

      // Verify both upload and partner check fetch calls were made
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/room/test-room-123/upload-images",
        expect.objectContaining({
          method: "POST",
        })
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/room/test-room-123/partner-images?userSlot=a",
        expect.objectContaining({
          method: "GET",
        })
      );
    });
  });
});
