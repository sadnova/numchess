import { test, expect } from "@playwright/test";

test("skip link targets main content on play", async ({ page }) => {
  await page.goto("/play");
  await page.getByRole("link", { name: "Skip to main content" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("play page has main landmark", async ({ page }) => {
  await page.goto("/play");
  await expect(page.locator("main#main-content")).toBeVisible();
});
