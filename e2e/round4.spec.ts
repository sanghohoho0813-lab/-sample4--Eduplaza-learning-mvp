// 4차 고도화: 내 학습 서재 · 학습 캘린더 · 상세 목차 · 검색 힌트·정렬 시트 · 새 사용자 빈 상태
import { expect, isMobile, test } from "./fixtures";

test("내 학습: 듣는 강의와 완주한 강의가 나뉘고, 각 강의에서 바로 이어 듣거나 다음 단계로", async ({ page }) => {
  await page.goto("/my-learning");
  const progress = page.locator('section[aria-labelledby="lib-progress"]');
  const done = page.locator('section[aria-labelledby="lib-done"]');
  await expect(progress.locator("ul > li.card")).toHaveCount(4);
  await expect(done.locator("ul > li.card")).toHaveCount(2);
  // 가장 최근에 공부한 강의가 맨 위
  await expect(progress.locator("ul > li.card").first()).toContainText("데이터 분석 입문 with Python");
  await expect(progress.locator("ul > li.card").first()).toContainText("8/12");
  await expect(done.locator("ul > li.card").first()).toContainText("처음부터 다시 보기");

  await progress.getByRole("link", { name: "SQL로 배우는 데이터 분석 이어서 학습" }).click();
  await expect(page).toHaveURL(/\/learn\/c9\?lesson=/);
});

test("캘린더: 공부한 날은 학습 시간만큼 진하게, 날을 고르면 그날의 흐름을 시간순으로", async ({ page }) => {
  await page.goto("/calendar");
  await expect(page.locator('section[aria-labelledby="month-heading"]')).toContainText(/\d+일 공부했어요/);
  // '어제'는 브라우저 시간대 기준으로 — 테스트 프로세스(UTC)와 브라우저(Asia/Seoul)의 날짜가 다를 수 있다
  const y = await page.evaluate(() => {
    const now = new Date();
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return { m: d.getMonth() + 1, d: d.getDate(), prevMonth: d.getMonth() !== now.getMonth() };
  });
  if (y.prevMonth) await page.getByRole("button", { name: "이전 달" }).click();
  const day = page.getByRole("button", { name: new RegExp(`^${y.m}월 ${y.d}일, 학습 \\d+분`) });
  await day.click();
  const panel = page.locator('section[aria-labelledby="day-heading"]');
  await expect(panel).toContainText("레슨 3개");
  await expect(panel.locator("ol > li")).toHaveCount(3);
  await expect(panel.locator("ol > li").first()).toContainText(/\d{2}:\d{2}/);
});

test("상세: 목차 탭으로 섹션 이동, 읽는 위치가 표시된다", async ({ page }) => {
  await page.goto("/courses/c1");
  const nav = page.getByRole("navigation", { name: "강의 정보 목차" });
  await nav.getByRole("link", { name: /후기/ }).click();
  await expect(nav.locator('a[aria-current="location"]')).toContainText("후기");
  await expect(page.locator("#reviews")).toBeInViewport();
});

test("검색: 비어 있는 검색칸을 누르면 최근 검색어·인기 키워드, 고르면 바로 검색", async ({ page }) => {
  if (isMobile(page)) {
    await page.goto("/courses");
    await page.locator("#course-search").fill("SQL");
    await page.locator("#course-search").press("Enter");
    await page.getByRole("button", { name: "검색어 지우기" }).first().click();
    await page.locator("#course-search").focus();
    const hints = page.locator("#mobile-search-hints");
    await expect(hints).toContainText("최근 검색어");
    await expect(hints.getByRole("button", { name: "SQL", exact: true }).first()).toBeVisible();
    await hints.getByRole("button", { name: "Python", exact: true }).click();
    await expect(page).toHaveURL(/q=Python/);
    await expect(page.locator("#course-search")).toHaveValue("Python");
  } else {
    await page.goto("/report");
    await page.getByRole("combobox", { name: "강의 검색" }).focus();
    const hints = page.locator("#search-suggestions");
    await expect(hints).toContainText("인기 강의 키워드");
    await hints.getByRole("button", { name: "ChatGPT", exact: true }).click();
    await expect(page).toHaveURL(/\/courses\?q=ChatGPT/);
    await page.goto("/report");
    await page.getByRole("combobox", { name: "강의 검색" }).focus();
    await expect(page.locator("#search-suggestions")).toContainText("최근 검색어");
  }
});

test("정렬(모바일·태블릿): 바텀 시트에서 고르면 바로 적용", async ({ page }) => {
  test.skip(!isMobile(page), "1280px 미만 전용 시트");
  await page.goto("/courses");
  await page.getByRole("button", { name: /^정렬:/ }).click();
  const sheet = page.getByRole("dialog", { name: "정렬" });
  await expect(sheet.getByRole("radio", { name: /추천순/ })).toHaveAttribute("aria-checked", "true");
  await sheet.getByRole("radio", { name: /평점순/ }).click();
  await expect(sheet).toBeHidden();
  await expect(page).toHaveURL(/sort=rating/);
  await expect(page.getByRole("button", { name: "정렬: 평점순" })).toBeVisible();
});

test("새 사용자: 할 수 없는 일을 권하지 않고, 수강을 시작하면 과제 마감이 그날 기준으로 정해진다", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() =>
    localStorage.setItem("eduplaza-state-v3", JSON.stringify({ enrollments: [], activity: [] }))
  );
  await page.reload();
  const plan = page.locator(`section[aria-labelledby="plan-heading-${isMobile(page) ? "m" : "d"}"]`);
  await expect(plan).toContainText("첫 강의 고르기");
  await expect(plan).not.toContainText("모두 마쳤어요");

  await page.goto("/quiz?tab=assignment");
  await expect(page.getByText("아직 과제가 없어요")).toBeVisible();

  await page.goto("/courses/c1");
  await page.getByRole("button", { name: "수강 시작하기" }).first().click();
  await expect(page).toHaveURL(/\/learn\/c1/);
  await page.goto("/quiz?tab=assignment");
  const cards = page.locator("article");
  await expect(cards).toHaveCount(2);
  await expect(cards.first()).toContainText(/D-\d/);
  await expect(page.locator("main")).not.toContainText("오늘 마감");
});
