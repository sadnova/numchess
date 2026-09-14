import { test, expect } from "@playwright/test";

test("PWA manifest is served", async ({ page }) => {
  const res = await page.goto("/manifest.webmanifest");
  expect(res?.ok()).toBeTruthy();
});

test("offline reload after service worker (preview build)", async ({
  page,
  context,
}) => {
  test.skip(
    process.env.PWA_E2E !== "1",
    "Set PWA_E2E=1 with `vite preview` to run offline SW test",
  );
  await page.goto("/play");
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(
    () => navigator.serviceWorker?.controller != null,
    null,
    { timeout: 60_000 },
  );
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId("app-shell")).toBeVisible({ timeout: 15_000 });
});
