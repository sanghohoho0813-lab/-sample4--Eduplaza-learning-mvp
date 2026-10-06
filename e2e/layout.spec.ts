// 다양한 폭에서 가로 스크롤(넘침)이 생기지 않는지 — 문서와 body 둘 다 확인한다.
import { expect, test } from "./fixtures";

const PAGES = ["/", "/courses", "/courses/c1", "/learn/c1", "/my-learning", "/quiz?tab=assignment", "/notes", "/calendar", "/report", "/my"];
const WIDTHS = [320, 360, 390, 768, 1024, 1440];

test.describe("가로 넘침 없음", () => {
  test.skip(({ isMobile }) => isMobile, "폭을 직접 바꿔 가며 한 번만 검사");
  for (const width of WIDTHS) {
    test(`${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const path of PAGES) {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        const w = await page.evaluate(() => ({
          doc: document.documentElement.scrollWidth,
          body: document.body.scrollWidth,
          vw: innerWidth,
        }));
        expect.soft(Math.max(w.doc, w.body), `${path} @${width}`).toBeLessThanOrEqual(w.vw);
      }
    });
  }
});
