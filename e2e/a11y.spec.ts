// 모든 주요 화면을 axe로 검사한다(WCAG 2.1 A/AA). 열린 대화상자·패널 상태도 포함.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

const PAGES = [
  "/", "/courses", "/courses/c1", "/courses/c4", "/learn/c1", "/learn/c5", "/my-learning",
  "/quiz", "/quiz?tab=assignment", "/quiz/q1", "/notes", "/calendar", "/report", "/my", "/nope",
];

const scan = (page: import("@playwright/test").Page) =>
  new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .exclude("#mirae-history-nav") // 데모 공용 스크립트(이 앱 밖의 코드)
    .analyze();

for (const path of PAGES) {
  test(`axe: ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const { violations } = await scan(page);
    expect(violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
}

test("axe: 열린 확인창·알림 패널", async ({ page }) => {
  await page.goto("/");
  await page.locator('button[aria-controls="notice-panel"]').click();
  expect((await scan(page)).violations).toEqual([]);
  await page.goto("/notes");
  await page.getByRole("button", { name: "노트 삭제" }).first().click();
  expect((await scan(page)).violations).toEqual([]);
});
