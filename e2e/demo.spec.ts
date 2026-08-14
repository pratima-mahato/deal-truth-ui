import { test, expect } from "@playwright/test";

const CALL = "call-acme-saas-labs";

test("demo: open call, jump to evidence, search", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /shows its receipts/i })).toBeVisible();
  await page.getByText(/Sarah Mitchell/i).first().click();
  await expect(page.getByText(/The verdict/i).first()).toBeVisible();
  await page.locator(".receipt .btn.play").first().click();
  await expect(page.locator(".seg.focus")).toBeVisible();
  await page.goto("/search?q=pricing");
  await expect(page.getByRole("heading", { name: /Find the moment/i })).toBeVisible();
});

test("screenshot demo route", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/demo");
  await expect(page.getByText(/The verdict/i).first()).toBeVisible();
  await page.screenshot({ path: "artifacts/deal-truth-killer-screenshot.png", fullPage: false });
});

test("send is locked until the unsupported claim is removed", async ({ page }) => {
  await page.goto(`/calls/${CALL}/act`);
  const send = page.getByRole("button", { name: /locked|copy the draft/i });
  await expect(send).toBeDisabled();
  await page.getByRole("button", { name: /remove this sentence/i }).click();
  await expect(send).toBeEnabled();
});

test("refused claims render with error codes", async ({ page }) => {
  await page.goto(`/calls/${CALL}/verdict`);
  await expect(page.locator(".receipt.blocker")).toHaveCount(4);
  await expect(page.getByText(/EVIDENCE_(UNSUPPORTED|WRONG_SPEAKER|SEGMENT_MISSING)/)).toHaveCount(4);
});

test("processing gate log", async ({ page }) => {
  await page.goto(`/calls/${CALL}/processing`);
  await expect(page.locator(".gl-row")).toHaveCount(16, { timeout: 15000 });
  await expect(page.locator(".gl-row .gl-bad")).toHaveCount(4);
});

test("search is evidence-first", async ({ page }) => {
  await page.goto("/search?q=security");
  await expect(page.locator(".receipt")).not.toHaveCount(0);
  await expect(page.locator("mark")).not.toHaveCount(0);
  await page.goto("/search?q=zzzqqq");
  await expect(page.getByText(/We return no result rather than a loose one/)).toBeVisible();
});
