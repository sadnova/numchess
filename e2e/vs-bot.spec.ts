import { test, expect } from "@playwright/test";

test("vs bot: bot moves after human without clicking bot inventory", async ({
  page,
}) => {
  await page.goto("/play");
  await page.getByTestId("mode-vsbot").click();
  await page.getByTestId("seat-p1").click();
  await page.getByRole("button", { name: /new game/i }).click();

  await page.getByTestId("p1-tile-3").click();
  await page.getByTestId("cell-0").click();

  await expect(page.getByTestId("turn-bot-thinking")).toBeVisible({
    timeout: 3000,
  });

  const plyBefore = await page.locator('[role="status"]').textContent();
  await expect(async () => {
    const cells = page.getByTestId(/^cell-/);
    const filled = await cells.filter({ hasNotText: "·" }).count();
    expect(filled).toBeGreaterThanOrEqual(2);
  }).toPass({ timeout: 20000 });

  void plyBefore;
});
