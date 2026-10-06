import { expect, test as base, type Page } from "@playwright/test";

/** 콘솔 에러·페이지 예외가 하나라도 나면 테스트를 실패시킨다 */
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
      page.on("console", (m) => {
        // 제외: 외부 웹폰트(네트워크 정책), 의도된 404 응답,
        // 테스트가 page.goto로 이동하며 끊긴 Next 프리페치(RSC) 요청
        if (m.type() === "error" && !/fonts\.g|net::ERR|404|Failed to fetch RSC payload/.test(m.text())) {
          errors.push(m.text());
        }
      });
      await use(errors);
      expect(errors, "콘솔 에러 없음").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

export const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1280) < 640;

/** 메인 영역 텍스트(공백 정리) */
export async function mainText(page: Page) {
  return (await page.locator("main").innerText()).replace(/\s+/g, " ");
}
