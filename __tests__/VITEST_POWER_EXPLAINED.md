## Our Case Study: The RevealContent Component

```typescript
// components/reveal-content.tsx
import { useRouter } from "next/navigation";
import { usePersonalityImagesStore } from "@/stores/personality-images-store";
import { uploadImages, checkRevealReady } from "@/lib/actions";
import { useEffect, useState } from "react";

// The component also uses:
// - localStorage (browser API)
// - setTimeout/setInterval (timers)
// - URL.createObjectURL (blob URLs)
// - Environment variables
```

Testing this component means controlling **all** of these dependencies. Here's how Vitest makes the seemingly impossible feel effortless.

## The Magic Revealed: Module Interception System

### 1. Import Hijacking at Runtime

The first piece before your component even loads. Vitest intercepts module imports and replaces them with controlled mocks:

```typescript
// vitest.setup.ts - This runs BEFORE any test
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  })),
}));
```

**What happens behind the scenes:**

1. Your component imports `useRouter`
2. Vitest intercepts this import
3. Instead of Next.js router, component gets our mock
4. Component has NO IDEA it's not using the real router

### 2. The Zustand Store Challenge

Our biggest mocking challenge was the Zustand store. Here's the complete solution:

```typescript
// vitest.setup.ts - Global mock setup
let mockGetImagesForRoom = vi.fn(() => ({}));

vi.mock("@/stores/personality-images-store", () => ({
  usePersonalityImagesStore: vi.fn((selector) => {
    const mockStore = {
      getImagesForRoom: mockGetImagesForRoom,
      clearImages: vi.fn(),
      setImages: vi.fn(),
    };
    return selector ? selector(mockStore) : mockStore;
  }),
}));

// __tests__/utils/test-data.ts - Per-test control
export function mockZustandWithImages(images: Record<string, File> = {}) {
  mockGetImagesForRoom.mockImplementation(() => images);
}
```

**The magic in action:**

```typescript
// In our component:
const getImagesForRoom = usePersonalityImagesStore(
  (state) => state.getImagesForRoom
);
const images = getImagesForRoom(roomId);

// What actually happens:
// 1. usePersonalityImagesStore returns our mock store
// 2. getImagesForRoom is our mockGetImagesForRoom function
// 3. We control what it returns in each test
```

### 3. Dynamic Mock Control Per Test

Here's where Vitest truly shines - we can change mock behavior for each specific test scenario:

```typescript
test("should stay in loading when no images present", async () => {
  // Mock store returns empty object (no images)
  mockZustandWithImages({});

  render(<RevealContent />);

  // Component sees no images, stays in loading state
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
});

test("should trigger upload when images are present", async () => {
  // Mock store returns actual images
  mockZustandWithImages(createMockImages());

  render(<RevealContent />);

  // Component sees images, starts upload process
  await waitFor(() => {
    expect(mockUploadImages).toHaveBeenCalled();
  });
});
```

**The component's perspective:**

- In test 1: `getImagesForRoom()` returns `{}` → "I have no images"
- In test 2: `getImagesForRoom()` returns `{image1: File, image2: File}` → "I have images to upload!"

### 4. API Function Mocking with Complete Control

Our component calls external API functions. We mock these too:

```typescript
// vitest.setup.ts
vi.mock("@/lib/actions", () => ({
  uploadImages: vi.fn(),
  checkRevealReady: vi.fn(),
}));

// In tests - complete control over API behavior
test("should handle upload errors gracefully", async () => {
  mockZustandWithImages(createMockImages());

  // Make the API fail
  const mockUploadImages = vi.mocked(uploadImages);
  mockUploadImages.mockRejectedValue(new Error("Network failed"));

  render(<RevealContent />);

  // Component tries to upload, gets our error, shows error UI
  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});

test("should complete successful upload flow", async () => {
  mockZustandWithImages(createMockImages());

  // Make the API succeed
  const mockUploadImages = vi.mocked(uploadImages);
  mockUploadImages.mockResolvedValue({ success: true });

  render(<RevealContent />);

  // Component uploads successfully, moves to next step
  await waitFor(() => {
    expect(screen.getByText(/upload complete/i)).toBeInTheDocument();
  });
});
```

### 5. Time Control: Mocking Timers

Our component uses `setTimeout` for polling. Vitest lets us control time itself:

```typescript
beforeEach(() => {
  vi.useFakeTimers(); // Replace real timers with controllable ones
});

afterEach(() => {
  vi.useRealTimers(); // Restore real timers
});

test("should poll for reveal status every 3 seconds", async () => {
  mockZustandWithImages(createMockImages());

  const mockUploadImages = vi.mocked(uploadImages);
  const mockCheckRevealReady = vi.mocked(checkRevealReady);

  mockUploadImages.mockResolvedValue({ success: true });
  mockCheckRevealReady.mockResolvedValue({ ready: false });

  render(<RevealContent />);

  // Wait for upload to complete
  await waitFor(() => {
    expect(mockUploadImages).toHaveBeenCalled();
  });

  // Fast-forward 3 seconds (instantly!)
  act(() => {
    vi.advanceTimersByTime(3000);
  });

  // Polling should have happened
  expect(mockCheckRevealReady).toHaveBeenCalledTimes(1);

  // Another 3 seconds
  act(() => {
    vi.advanceTimersByTime(3000);
  });

  // Should poll again
  expect(mockCheckRevealReady).toHaveBeenCalledTimes(2);
});
```

## Real-World Example: Complete Flow Test

Here's a test that demonstrates all the magic working together:

```typescript
test("complete user flow with error recovery", async () => {
  // 1. Setup user data in localStorage (mocked)
  const userData = createMockUserData();
  localStorage.setItem("currentUser", JSON.stringify(userData));

  // 2. Setup Zustand store with images
  mockZustandWithImages(createMockImages());

  // 3. Mock API behavior - first call fails, second succeeds
  const mockUploadImages = vi.mocked(uploadImages);
  const mockCheckRevealReady = vi.mocked(checkRevealReady);

  mockUploadImages.mockRejectedValueOnce(new Error("Rate limit exceeded"));
  mockUploadImages.mockResolvedValueOnce({ success: true });
  mockCheckRevealReady.mockResolvedValue({ ready: true });

  // 4. Render component
  render(<RevealContent />);

  // 5. Component automatically starts upload (useEffect triggers)
  await waitFor(() => {
    expect(mockUploadImages).toHaveBeenCalledTimes(1);
  });

  // 6. Error appears in UI
  await waitFor(() => {
    expect(screen.getByText(/rate limit/i)).toBeInTheDocument();
  });

  // 7. User clicks retry button
  const retryButton = screen.getByRole("button", { name: /try again/i });
  fireEvent.click(retryButton);

  // 8. Second upload attempt succeeds
  await waitFor(() => {
    expect(mockUploadImages).toHaveBeenCalledTimes(2);
  });

  // 9. Component starts polling (with fake timers)
  act(() => {
    vi.advanceTimersByTime(3000);
  });

  // 10. Reveal is ready, component navigates
  const mockRouter = vi.mocked(useRouter);
  await waitFor(() => {
    expect(mockRouter().replace).toHaveBeenCalledWith("/room/test-room/reveal");
  });
});
```

**What this test validates:**

- User data loading from localStorage
- Image presence detection
- Upload initiation
- Error handling and display
- User interaction (retry)
- Successful upload flow
- Polling behavior
- Navigation on completion

## Cool feats

### 1. Complete Transparency to Component

The component has absolutely NO IDEA it's being tested. From its perspective:

```typescript
// Component code that works exactly the same in test and production:
const router = useRouter(); // Gets mock in test, real router in production
const images = getImagesForRoom(roomId); // Gets mock data in test, real store in production
const result = await uploadImages(data); // Calls mock in test, real API in production
```

### 2. Total Environmental Control

We control every aspect of the component's environment:

```typescript
// Control what data exists
mockZustandWithImages(createMockImages());

// Control what APIs return
mockUploadImages.mockResolvedValue({ success: true });

// Control how fast time moves
vi.advanceTimersByTime(5000);

// Control what's in storage
localStorage.setItem("user", JSON.stringify(userData));

// Control where navigation goes
expect(mockRouter().replace).toHaveBeenCalledWith("/expected-route");
```

### 3. Real Behavior Testing

Because the component thinks everything is real, we're testing actual user workflows:

- How does the component handle upload failures?
- What happens when the user retries?
- Does polling work correctly?
- Are loading states shown at the right times?
- Does navigation happen when expected?

## The Factory Pattern: Realistic Test Data

We use factory functions to create realistic, consistent test data:

```typescript
// __tests__/utils/test-data.ts
export function createMockUserData(overrides = {}) {
  return {
    id: "test-user-123",
    roomId: "test-room-123",
    username: "testuser",
    avatarUrl: "https://example.com/avatar.jpg",
    ...overrides,
  };
}

export function createMockImages() {
  return {
    "cele-partner/cele1.webp": new File(["mock-image-data"], "cele1.webp", {
      type: "image/webp",
    }),
    "cele-partner/cele2.webp": new File(["mock-image-data"], "cele2.webp", {
      type: "image/webp",
    }),
  };
}

// Create different scenarios easily
export const TEST_SCENARIOS = {
  NO_IMAGES: {},
  WITH_IMAGES: createMockImages(),
  LARGE_IMAGES: createMockImages(true), // Different factory behavior
};
```

## Why Vitest Beats Other Testing Frameworks

### 1. Modern ES Modules Support

- No transpilation needed
- Works with our TypeScript setup out of the box
- Native import/export support

### 2. Intuitive Mocking API

```typescript
// Vitest - clean and intuitive
vi.mock("./module", () => ({ fn: vi.fn() }));
vi.mocked(fn).mockReturnValue("value");

// Jest - more verbose
jest
  .mock("./module", () => ({ fn: jest.fn() }))(
    fn as jest.MockedFunction<typeof fn>
  )
  .mockReturnValue("value");
```

### 3. Faster Execution

- Hot module reloading for tests
- Parallel execution by default
- Optimized for modern development workflows

### 4. Better Developer Experience

- Clear error messages
- Integrated debugging
- Watch mode that actually works

## The Results: Confident Component Testing

With this setup, our test suite validates real user behavior:

```bash
✓ RevealContent > should render without crashing (15ms)
✓ RevealContent > should show loading state initially (8ms)
✓ RevealContent > should redirect when no user data (12ms)
✓ RevealContent > should stay in loading when user has no images (11ms)
✓ RevealContent > should trigger upload when images are present (18ms)
✓ RevealContent > should complete upload flow successfully (22ms)
✓ RevealContent > should handle upload errors gracefully (16ms)
✓ RevealContent > should handle rate limit errors (14ms)
✓ RevealContent > should verify upload with correct parameters (19ms)
✓ RevealContent > should verify reveal check with correct parameters (13ms)

Tests  10 passed (10)
Duration  148ms
```

Every test validates actual user workflows, not just that components render. The magic of Vitest is that it makes testing complex, interconnected components feel natural and reliable.

## Common Patterns We Use

### 1. The Arrange-Act-Assert Pattern

```typescript
test("example test", async () => {
  // Arrange: Setup mocks and data
  mockZustandWithImages(createMockImages());
  mockUploadImages.mockResolvedValue({ success: true });

  // Act: Render component and trigger behavior
  render(<RevealContent />);

  // Assert: Verify expected outcomes
  await waitFor(() => {
    expect(mockUploadImages).toHaveBeenCalled();
  });
});
```

### 2. Error Scenario Testing

```typescript
// Test different error conditions
mockUploadImages.mockRejectedValue(new Error("Network error"));
mockUploadImages.mockRejectedValue(new Error("Rate limit exceeded"));
mockUploadImages.mockRejectedValue(new Error("Server error"));
```

### 3. State Transition Testing

```typescript
// Test how component responds to different states
mockZustandWithImages({}); // No images state
rerender(<RevealContent />);
expect(screen.getByText(/loading/i)).toBeInTheDocument();

mockZustandWithImages(createMockImages()); // Has images state
rerender(<RevealContent />);
expect(screen.getByText(/uploading/i)).toBeInTheDocument();
```
