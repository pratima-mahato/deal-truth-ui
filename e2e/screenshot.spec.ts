import { test, expect } from "@playwright/test";

test("captures 1440x900 demo screenshot", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/demo");
  await expect(page.getByText(/Call intelligence/i).first()).toBeVisible();
  await expect(page.getByText(/Buying signals/i).first()).toBeVisible();
  await page.screenshot({ path: "artifacts/open-gong-killer-screenshot.png" });
});
