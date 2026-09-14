import { test, expect } from "@playwright/test";

test("bot spectator: autoplay advances and pause holds ply", async ({ page }) => {
  test.setTimeout(90_000);

  await page.goto("/play");
  await page.getByTestId("mode-bot-spectator").click();
  await page.getByTestId("bot-p1-easy").click();
  await page.getByTestId("bot-p2-easy").click();
  await page.getByTestId("spectator-pace-off").click();
  await page.getByRole("button", { name: /new game/i }).click();

  await expect(page.getByTestId("turn-bot-thinking")).toBeVisible({
    timeout: 5000,
  });

  await expect(async () => {
    const filled = await page
      .getByTestId(/^cell-/)
      .filter({ hasNotText: "·" })
      .count();
    expect(filled).toBeGreaterThanOrEqual(2);
  }).toPass({ timeout: 60_000 });

  const plyBefore = await page
    .getByTestId(/^cell-/)
    .filter({ hasNotText: "·" })
    .count();

  await page.getByTestId("spectator-play-pause").click();
  await expect(page.getByTestId("turn-spectator-paused")).toBeVisible();

  await page.waitForTimeout(2500);

  const plyAfterPause = await page
    .getByTestId(/^cell-/)
    .filter({ hasNotText: "·" })
    .count();
  expect(plyAfterPause).toBe(plyBefore);

  await page.getByTestId("spectator-play-pause").click();

  await expect(async () => {
    const filled = await page
      .getByTestId(/^cell-/)
      .filter({ hasNotText: "·" })
      .count();
    expect(filled).toBeGreaterThan(plyBefore);
  }).toPass({ timeout: 60_000 });
});
