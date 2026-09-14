import { test, expect } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

async function readBoard(page: import("@playwright/test").Page) {
  const values: string[] = [];
  for (let i = 0; i < 36; i++) {
    const text = await page.getByTestId(`cell-${i}`).innerText();
    values.push(text.trim());
  }
  return values;
}

test.describe("replay persistence", () => {
  test.use({
    permissions: ["clipboard-read", "clipboard-write"],
  });

  test("four plies export import restores board", async ({ page }) => {
    await page.goto("/play");
    await expect(page.getByTestId("app-shell")).toBeVisible();

    await page.getByTestId("mode-local2p").click();

    await page.getByTestId("p1-tile-3").click();
    await page.getByTestId("cell-0").click();

    await page.getByTestId("p2-tile-4").click();
    await page.getByTestId("cell-6").click();

    await page.getByTestId("p1-tile-2").click();
    await page.getByTestId("cell-1").click();

    await page.getByTestId("p2-tile-1").click();
    await page.getByTestId("cell-7").click();

    const before = await readBoard(page);

    await page.getByRole("button", { name: "Copy replay" }).click();
    const json = await page.evaluate(async () => navigator.clipboard.readText());
    expect(json).toContain("numchess-replay/v1");

    await page.getByRole("button", { name: "New game" }).click();
    const cleared = await readBoard(page);
    expect(cleared.every((v) => v === "·")).toBe(true);

    const tmp = path.join(os.tmpdir(), `numchess-e2e-${Date.now()}.json`);
    fs.writeFileSync(tmp, json, "utf8");

    await page.getByTestId("import-replay-input").setInputFiles(tmp);
    await expect(page.getByText("Replay loaded")).toBeVisible();

    const after = await readBoard(page);
    expect(after).toEqual(before);

    fs.unlinkSync(tmp);
  });
});
