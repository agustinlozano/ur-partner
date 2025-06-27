import { test, expect } from "@playwright/test";

test.describe("CreateRoom Complete Flow", () => {
  test("should complete full room creation flow - Girlfriend", async ({
    page,
  }) => {
    // Step 1: Navigate to room creation page
    await page.goto("/room");

    // Step 2: Verify page loaded correctly
    await expect(page.getByText("Create a Room")).toBeVisible();
    await expect(page.getByLabel("Your Name")).toBeVisible();

    // Step 3: Fill name field
    const nameInput = page.getByLabel("Your Name");
    await nameInput.fill("Julieta Blua");

    // Step 4: Select girlfriend role
    await page.getByRole("radio", { name: "Girlfriend 💛" }).click();

    // Step 5: Wait for emoji selector to appear (use the label specifically)
    await expect(
      page.locator("label").filter({ hasText: "Choose Your Avatar" })
    ).toBeVisible({
      timeout: 10000,
    });

    // Step 6: Select an emoji (wait for emoji buttons to be available)
    await expect(
      page.locator("button").filter({ hasText: "👧" }).first()
    ).toBeVisible();
    await page.locator("button").filter({ hasText: "👧" }).first().click();

    // Step 7: Verify form is ready for submission
    const submitButton = page.getByRole("button", { name: "Create Room" });
    await expect(submitButton).toBeEnabled();

    // Step 8: Submit form and capture navigation
    const navigationPromise = page.waitForURL(/\/room\/[a-zA-Z0-9]+/, {
      timeout: 30000,
    });
    await submitButton.click();

    // Step 9: Verify redirection to room page
    await navigationPromise;

    // Step 10: Verify we're on the correct room page (accept query parameters)
    expect(page.url()).toMatch(/\/room\/[a-zA-Z0-9]+/);

    // Step 11: Verify room page content loads
    await expect(page).toHaveURL(/\/room\/[a-zA-Z0-9]+/);

    // Step 12: Extract and verify room ID
    const url = page.url();
    const roomIdMatch = url.match(/\/room\/([a-zA-Z0-9]+)/);
    expect(roomIdMatch).not.toBeNull();
    const roomId = roomIdMatch![1];
    expect(roomId).toMatch(/^[A-Z0-9]{8}$/); // Verify room ID format

    console.log(`✅ Room created successfully with ID: ${roomId}`);

    // Step 13: Verify initial loading state (checking...)
    await expect(page.getByText("checking")).toBeVisible({ timeout: 5000 });

    // Step 14: Wait for loading to complete and verify Girlfriend card
    const girlfriendCard = page.getByTestId("girlfriend-card");
    await expect(girlfriendCard).toBeVisible({ timeout: 10000 });

    // Step 15: Verify Girlfriend card shows "Joined" status
    await expect(girlfriendCard.getByText("Julieta Blua")).toBeVisible();
    await expect(girlfriendCard.getByText("✅ Joined")).toBeVisible();
    await expect(girlfriendCard.getByText("👧")).toBeVisible(); // Our selected emoji

    // Step 16: Verify Boyfriend card shows "Pending" status
    const boyfriendCard = page.getByTestId("boyfriend-card");
    await expect(boyfriendCard).toBeVisible();
    await expect(boyfriendCard.getByText("Waiting to join...")).toBeVisible();
    await expect(boyfriendCard.getByText("⏳ Pending")).toBeVisible();

    // Step 17: Verify share room section is available
    const shareSection = page.getByTestId("share-room-id");
    await expect(shareSection).toBeVisible();
    await expect(
      shareSection.getByText("Share this Room ID with your partner")
    ).toBeVisible();

    // Step 18: Verify copy room ID functionality is present
    await expect(shareSection.getByText(roomId)).toBeVisible(); // Room ID should be displayed

    console.log(`✅ All room page elements verified successfully!`);
  });
});
