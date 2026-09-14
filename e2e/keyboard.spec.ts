import { test, expect } from "@playwright/test";

test("keyboard selects tile and focuses grid", async ({ page }) => {
  await page.goto("/play");
  await page.getByTestId("mode-local2p").click();
  await page.keyboard.press("3");
  await expect(page.getByText(/you chose/i)).toBeVisible();
  await expect(page.getByText(/empty square on the board/i)).toBeVisible();
  await page.getByTestId("cell-0").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("cell-0")).toHaveText("3");
});
