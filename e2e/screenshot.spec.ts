import { test, expect } from "@playwright/test";

test("captures 1440x900 demo screenshot", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/calls/call-acme-saas-labs/verdict");
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await expect(page.getByText(/Reality check/i).first()).toBeVisible();
  await page.locator(".reality").first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: "artifacts/deal-truth-killer-screenshot.png" });
});
