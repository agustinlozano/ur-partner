# How Modern Component Testing Works

## The Challenge: Our RevealContent Component

Our `RevealContent` component is a perfect example of modern component complexity:

```typescript
// Our component has MANY dependencies:
import { useRouter } from "next/navigation";
import { usePersonalityImagesStore } from "@/stores/personality-images-store";
import { uploadImages, checkRevealReady } from "@/lib/actions";
import { useEffect, useState } from "react";
// Plus localStorage, timers, blob URLs, etc.
```

Testing this component requires controlling ALL these dependencies. Here's how Vitest makes it possible.

## The Magic Explained: Module Mocking System

### 1. Global Module Interception

When you run a test, Vitest intercepts ALL module imports and can replace them with mocks. This happens BEFORE your component even loads:

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

**What happens:** When `RevealContent` imports `useRouter`, it gets our mock instead of the real Next.js router.

### 2. Zustand Store Mocking: The Complex Case

Our biggest challenge was the Zustand store. Here's how we solved it:

```typescript
// vitest.setup.ts - Global mock that can be overridden
let mockGetImagesForRoom = vi.fn(() => ({}));

vi.mock("@/stores/personality-images-store", () => ({
  usePersonalityImagesStore: vi.fn((selector) => {
    const store = {
      getImagesForRoom: mockGetImagesForRoom,
      clearImages: vi.fn(),
      // ... other store methods
    };
    return selector ? selector(store) : store;
  }),
}));
```

**The Magic:** Our component calls `usePersonalityImagesStore((state) => state.getImagesForRoom)` and gets our controlled mock function.

### 3. Dynamic Mock Control Per Test

Here's where it gets really powerful - we can change mock behavior for each test:

```typescript
// __tests__/utils/test-data.ts
export function mockZustandWithImages(images: Record<string, File> = {}) {
  mockGetImagesForRoom.mockImplementation(() => images);
}

// In our test:
test("should trigger upload when images are present", async () => {
  // Control what the store returns
  mockZustandWithImages(createMockImages());

  render(<RevealContent />);

  // Component thinks it has real images!
  await waitFor(() => {
    expect(mockUploadImages).toHaveBeenCalled();
  });
});
```

**What happens:**

1. Component calls `getImagesForRoom()`
2. Gets our mock images
3. Thinks it has real data
4. Proceeds with upload logic
5. We can verify the upload was called

### 4. API Function Mocking

Our component calls `uploadImages` and `checkRevealReady`. We mock these too:

```typescript
// vitest.setup.ts
vi.mock("@/lib/actions", () => ({
  uploadImages: vi.fn(),
  checkRevealReady: vi.fn(),
}));

// In tests:
const mockUploadImages = vi.mocked(uploadImages);
const mockCheckRevealReady = vi.mocked(checkRevealReady);

test("should handle upload errors gracefully", async () => {
  mockZustandWithImages(createMockImages());
  mockUploadImages.mockRejectedValue(new Error("Network failed"));

  render(<RevealContent />);

  // Component tries to upload, gets our error
  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

### 5. Timer Mocking: Controlling Time

Our component uses `setTimeout` for polling. Vitest lets us control time:

```typescript
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

test("should poll for reveal status", async () => {
  mockZustandWithImages(createMockImages());
  mockUploadImages.mockResolvedValue({ success: true });
  mockCheckRevealReady.mockResolvedValue({ ready: false });

  render(<RevealContent />);

  // Fast-forward time instead of waiting
  act(() => {
    vi.advanceTimersByTime(3000); // 3 seconds instantly
  });

  expect(mockCheckRevealReady).toHaveBeenCalledTimes(2);
});
```

## The Complete Picture: How It All Works Together

Here's a real test that shows all the magic working together:

```typescript
test("complete upload flow with error recovery", async () => {
  // 1. Setup localStorage (browser API mock)
  const userData = createMockUserData();
  localStorage.setItem("currentUser", JSON.stringify(userData));

  // 2. Control Zustand store behavior
  mockZustandWithImages(createMockImages());

  // 3. Mock API responses
  mockUploadImages.mockRejectedValueOnce(new Error("Rate limit"));
  mockUploadImages.mockResolvedValueOnce({ success: true });
  mockCheckRevealReady.mockResolvedValue({ ready: true });

  // 4. Render component - it thinks everything is real!
  render(<RevealContent />);

  // 5. Component automatically starts upload (useEffect)
  await waitFor(() => {
    expect(mockUploadImages).toHaveBeenCalledTimes(1);
  });

  // 6. Error appears
  expect(screen.getByText(/rate limit/i)).toBeInTheDocument();

  // 7. User clicks retry
  fireEvent.click(screen.getByText(/try again/i));

  // 8. Second upload succeeds
  await waitFor(() => {
    expect(mockUploadImages).toHaveBeenCalledTimes(2);
  });

  // 9. Auto-polling starts (controlled timers)
  act(() => {
    vi.advanceTimersByTime(3000);
  });

  // 10. Redirect happens (mocked router)
  expect(mockRouter.replace).toHaveBeenCalledWith("/room/test-room/reveal");
});
```

## Cool feats

### 1. Seamless Integration

The component has NO IDEA it's being tested. From its perspective:

- `useRouter()` returns a real router
- `getImagesForRoom()` returns real images
- `uploadImages()` makes real API calls
- `setTimeout()` works normally

### 2. Complete Control

We control every external dependency:

- What data the store returns
- Whether APIs succeed or fail
- How fast time moves
- What's in localStorage
- Where navigation goes

### 3. Real Behavior Testing

Because the component thinks everything is real, we test actual user flows:

- Upload process
- Error handling
- Retry logic
- Polling behavior
- Navigation flow

## The Factory Pattern: Clean Test Data

We use factories to create consistent test data:

```typescript
// __tests__/utils/test-data.ts
export function createMockUserData(overrides = {}) {
  return {
    id: "user123",
    roomId: "test-room",
    username: "testuser",
    ...overrides,
  };
}

export function createMockImages() {
  return {
    "cele-partner/cele1.webp": new File(["mock"], "cele1.webp", {
      type: "image/webp",
    }),
    "cele-partner/cele2.webp": new File(["mock"], "cele2.webp", {
      type: "image/webp",
    }),
  };
}
```

This ensures every test has realistic, consistent data.

## Common Patterns We Use

### 1. Arrange-Act-Assert with Mocks

```typescript
test("example", async () => {
  // Arrange: Setup mocks
  mockZustandWithImages(createMockImages());
  mockUploadImages.mockResolvedValue({ success: true });

  // Act: Render and interact
  render(<RevealContent />);

  // Assert: Verify behavior
  await waitFor(() => {
    expect(mockUploadImages).toHaveBeenCalled();
  });
});
```

### 2. Error Simulation

```typescript
mockUploadImages.mockRejectedValue(new Error("Network failed"));
```

### 3. State Transitions

```typescript
// Start with no images
mockZustandWithImages({});
expect(screen.getByText(/loading/i)).toBeInTheDocument();

// Add images
mockZustandWithImages(createMockImages());
rerender(<RevealContent />);
expect(screen.getByText(/uploading/i)).toBeInTheDocument();
```

## The Result: Confident Testing

With this setup, we can test complex user flows with confidence:

```bash
✓ RevealContent > should render without crashing
✓ RevealContent > should show loading state initially
✓ RevealContent > should redirect when no user data
✓ RevealContent > should trigger upload when images present
✓ RevealContent > should complete upload flow successfully
✓ RevealContent > should handle upload errors gracefully
✓ RevealContent > should handle rate limit errors
✓ RevealContent > should verify upload with correct parameters
✓ RevealContent > should verify reveal check with correct parameters

Tests  9 passed (9)
```

Every test verifies real user behavior, not just that components render. That's the true magic of Vitest - it makes testing complex, real-world components feel natural and reliable.
