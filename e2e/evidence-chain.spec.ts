import { test, expect } from "@playwright/test";

const CALL = "call-demo";
const VIEWS = ["verdict", "record", "act", "brief"];

for (const view of VIEWS) {
  test(`claim click → transcript focus + audio + waveform band (${view})`, async ({ page }) => {
    await page.goto(`/calls/${CALL}/${view}`);
    await page.locator(".receipt .btn.play, .btn.play").first().click();
    await expect(page.locator(".seg.focus")).toBeVisible();
    await expect(page.locator(".evidence-band")).toHaveCount(1);
    expect(
      await page.evaluate(() => !!document.querySelector("audio") && !document.querySelector("audio")!.paused),
    ).toBe(true);
  });
}
