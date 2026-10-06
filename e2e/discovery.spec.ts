// 강의 찾기: 검색·필터·정렬이 주소에 남아 뒤로 와도 유지되고, 잘못된 값·빈 결과도 자연스럽게 처리된다.
import { expect, isMobile, test } from "./fixtures";

test("모바일: 헤더 검색 → 검색창 포커스 → 실시간 결과 → 상세 다녀와도 유지", async ({ page }) => {
  test.skip(!isMobile(page), "모바일 전용 검색창");
  await page.goto("/");
  await page.getByRole("link", { name: "강의 검색" }).click();
  await expect(page.locator("#course-search")).toBeFocused();
  await expect(page).not.toHaveURL(/focus=/);

  await page.locator("#course-search").fill("SQL");
  await expect(page).toHaveURL(/q=SQL/);
  const rows = page.locator("ul.space-y-3 > li");
  await expect(rows).toHaveCount(1);

  await rows.first().locator("a").click();
  await expect(page).toHaveURL(/\/courses\/c\d+/);
  await page.goBack();
  await expect(page.locator("#course-search")).toHaveValue("SQL");

  await page.getByRole("button", { name: "검색어 지우기" }).first().click();
  await expect(page.getByText("18개 강의")).toBeVisible();
});

test("모바일: 필터 시트 — 결과 수 미리보기, Esc 닫기, 조건 칩으로 해제", async ({ page }) => {
  test.skip(!isMobile(page), "모바일 필터 시트");
  await page.goto("/courses");
  await page.getByRole("button", { name: /^필터/ }).click();
  const sheet = page.getByRole("dialog", { name: "필터" });
  await sheet.getByRole("button", { name: "입문", exact: true }).click();
  await expect(sheet.getByRole("button", { name: /개 강의 보기/ })).not.toHaveText(/^18개/);
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await page.getByRole("button", { name: "입문 조건 해제" }).click();
  await expect(page).not.toHaveURL(/level=/);
});

test("PC: 필터를 고르고 상세에 갔다 '돌아가기' 해도 조건 유지", async ({ page }) => {
  test.skip(isMobile(page), "PC 사이드 필터");
  await page.goto("/courses");
  const panel = page.getByRole("complementary", { name: "강의 필터" });
  await panel.getByRole("button", { name: "디자인", exact: true }).click();
  await panel.getByRole("button", { name: "입문", exact: true }).click();
  await expect(page).toHaveURL(/category=design/);
  await expect(page).toHaveURL(/level=beginner/);
  const count = await page.getByText(/총 \d+개의 강의/).innerText();

  await page.locator("a.card:visible").first().click();
  await page.getByRole("button", { name: "돌아가기", exact: true }).click();
  await expect(page).toHaveURL(/category=design/);
  await expect(page.getByText(/총 \d+개의 강의/)).toHaveText(count);
});

test("잘못된 주소 값은 무시하고 전체 목록", async ({ page }) => {
  await page.goto("/courses?category=bogus&sort=zzz&level=x");
  await expect(page.locator("main")).toContainText(/18개(의)? 강의/);
  await expect(page.getByRole("button", { name: /조건 해제$/ })).toHaveCount(0);
});

test("검색 결과가 없으면 이유와 되돌릴 방법을 준다", async ({ page }) => {
  await page.goto("/courses?q=블록체인");
  await expect(page.getByText("‘블록체인’에 맞는 강의가 없어요")).toBeVisible();
  await page.getByRole("button", { name: "검색어 지우기" }).last().click();
  await expect(page.locator("main")).toContainText(/18개(의)? 강의/);
});

test("상세: 미수강 강의는 레슨 번호, 완주한 강의는 '다시 보기'", async ({ page }) => {
  await page.goto("/courses/c4");
  await expect(page.locator("section").filter({ hasText: "커리큘럼" }).getByText("1", { exact: true }).first()).toBeVisible();
  await page.goto("/courses/c11"); // 시드에서 완주한 강의
  await expect(page.getByRole("button", { name: /다시 보기/ }).first()).toBeVisible();
});
