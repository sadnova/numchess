import { test, expect } from "@playwright/test";

test("app loads and shows board", async ({ page }) => {
  await page.goto("/play");
  await expect(page.getByTestId("app-shell")).toBeVisible();
  await expect(page.getByTestId("cell-0")).toBeVisible();
  await expect(page.getByTestId("inventory-p1")).toBeVisible();
});

test("root redirects to play", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/play/);
  await expect(page.getByTestId("app-shell")).toBeVisible();
});
