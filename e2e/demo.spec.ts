import { test, expect } from "@playwright/test";

test("demo: open call, jump to pricing evidence, search", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Turn conversations into deal intelligence/i })).toBeVisible();
  await page.getByRole("link", { name: /Sarah Mitchell/i }).first().click();
  await expect(page.getByText(/Call intelligence/i).first()).toBeVisible();
  await page.getByRole("button", { name: /View evidence/i }).first().click();
  await expect(page.getByText(/Why we think this/i).first()).toBeVisible();
  await page.getByRole("button", { name: /Jump to transcript/i }).click();
  await expect(page.getByText(/We currently pay about \$400/i).first()).toBeVisible();
  await page.goto("/search?q=pricing objections");
  await expect(page.getByRole("heading", { name: /Ask across every conversation/i })).toBeVisible();
  await expect(page.getByText(/Price is almost twice/i).first()).toBeVisible();
});

test("screenshot demo route", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/demo");
  await expect(page.getByText(/Call intelligence/i).first()).toBeVisible();
  await page.screenshot({ path: "artifacts/open-gong-killer-screenshot.png", fullPage: false });
});
