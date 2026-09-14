import { test, expect } from "@playwright/test";

test.describe("strategic mode smoke", () => {
  test("8x8 board and tile 6 inventory", async ({ page }) => {
    await page.goto("/play");
    await expect(page.getByTestId("app-shell")).toBeVisible();

    await page.getByTestId("board-strategic").click();
    await expect(page.getByTestId("cell-63")).toBeVisible();
    await expect(page.getByTestId("p1-tile-6")).toBeVisible();
    await expect(page.getByTestId("cell-36")).toBeVisible();
  });
});
