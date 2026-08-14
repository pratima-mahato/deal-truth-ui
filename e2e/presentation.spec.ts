import { test, expect } from "@playwright/test";

test("presentation walks every beat and hides nothing", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("p");
  for (let i = 0; i < 13; i++) {
    await page.waitForTimeout(900);
    const hidden = await page.evaluate(
      () =>
        [...document.querySelectorAll("#root *")].filter((e) => {
          const c = getComputedStyle(e);
          const r = e.getBoundingClientRect();
          return r.height > 40 && r.width > 40 && +c.opacity < 0.35 && c.visibility !== "hidden";
        }).length,
    );
    expect(hidden, `beat ${i + 1} left elements invisible`).toBe(0);
    await page.keyboard.press("ArrowRight");
  }
});
