// 제품 루프: 행동 하나가 홈·리포트·캘린더·내 학습에 실제로 반영되는지 끝까지 따라간다.
import { expect, test } from "./fixtures";

test.describe("학습 루프 (PC)", () => {
  test.skip(({ isMobile }) => isMobile, "PC 레이아웃의 사이드 카드 기준");

  test("수강 → 레슨 완료 → 복습 → 만점 → 과제 → 주간 목표 → 새로고침 후 유지", async ({ page }) => {
    const week = page.locator('aside [data-block="week"]');
    const goals = page.locator('aside section[aria-labelledby="today-goals-d"]');
    const nextSteps = page.locator('section[aria-label="지금 처리하면 좋은 일"]');

    await test.step("첫 방문 기준선", async () => {
      await page.goto("/");
      await expect(page.getByText(/12일 연속 학습 중/).first()).toBeVisible();
      await expect(week).toContainText("4시간 35분");
      await expect(week).toContainText("25분 남았어요");
      await expect(goals).toContainText("0/3");
      await expect(nextSteps).toContainText("내일 마감");
      await expect(nextSteps).toContainText("틀린 문제 2개");
    });

    await test.step("강의 찾기 → 상세 → 수강 시작 → 바로 첫 레슨", async () => {
      await page.goto("/courses");
      await page.locator('a[href="/courses/c7"]:visible').first().click();
      await page.getByRole("button", { name: "수강 시작하기" }).first().click();
      await expect(page).toHaveURL(/\/learn\/c7\?lesson=c7-s1-l1/);
    });

    await test.step("레슨 완료 → 진도·주간 시간·연속 학습이 패널에 반영", async () => {
      await page.getByRole("button", { name: /학습 완료/ }).click();
      const panel = page.locator('section[aria-live="polite"]');
      await expect(panel).toContainText("진도가 13%로 올랐어요");
      await expect(panel).toContainText("+10분");
      await expect(panel).toContainText("15분 남았어요");
      await expect(panel).toContainText("13일 연속");
      await expect(panel.getByRole("link", { name: "다음 강의 이어보기" })).toBeVisible();
    });

    await test.step("홈에 반영", async () => {
      await page.goto("/");
      await expect(week).toContainText("4시간 45분");
      await expect(goals).toContainText("1/3");
      await expect(page.locator("section.bg-forest-950").first()).toContainText("초보자를 위한 Python");
      await expect(page.locator('aside section[aria-labelledby="recent-card-d"]')).toContainText("레슨 완료 · 10분");
    });

    await test.step("틀린 문제만 다시 풀기 → 취약 영역 해소", async () => {
      await page.locator('a[href="/quiz/q1?mode=review"]:visible').first().click();
      for (const [i, key] of ["3", "1"].entries()) {
        await expect(page.getByText(`${i + 1}/2`)).toBeVisible();
        await page.keyboard.press(key);
        await page.keyboard.press("Enter");
        await page.keyboard.press("Enter");
      }
      await expect(page.getByText("틀린 문제를 모두 해결했어요!")).toBeVisible();
      await expect(page.getByRole("link", { name: "다음 강의 이어보기" })).toBeVisible();
    });

    await test.step("퀴즈 만점 → 성취 해금", async () => {
      await page.goto("/quiz/q2");
      const keys = ["3", "2", "2", "2", "2", "2", "1"];
      for (const [i, key] of keys.entries()) {
        await expect(page.getByText(`${i + 1}/7`)).toBeVisible(); // 문항이 바뀐 뒤 입력
        await page.keyboard.press(key);
        await page.keyboard.press("Enter");
        await page.keyboard.press("Enter");
      }
      await expect(page.getByText("완벽해요! 모든 문제를 맞혔어요")).toBeVisible();
      await expect(page.getByRole("status").filter({ hasText: "퍼펙트 스코어" })).toBeVisible();
    });

    await test.step("리포트에 반영", async () => {
      await page.goto("/report");
      await expect(page.locator('section[aria-labelledby="weak-heading"]')).toContainText("다시 풀 문제가 없어요");
      const quiz = page.locator('section[aria-labelledby="quiz-heading"]');
      await expect(quiz).toContainText("전체 풀이 7/7");
      await expect(quiz).toContainText("오답 복습 2/2");
      await expect(page.locator('section[aria-labelledby="ach-heading"]')).toContainText("5/6");
    });

    await test.step("가장 급한 과제 제출 → 내 학습·캘린더·홈 반영", async () => {
      await page.goto("/quiz?tab=assignment");
      const first = page.locator("article").first();
      await expect(first.locator("h3")).toHaveText("분석 쿼리 작성 연습");
      await first.getByRole("button", { name: "과제 작성하기" }).click();
      await first.locator("textarea").fill("월별 신규 가입자 수를 COUNT와 GROUP BY로 구했습니다.");
      await first.getByRole("button", { name: "제출하기" }).click();
      await expect(page.locator("article#a5")).toContainText("제출 완료");
      await expect(page.locator("article#a5")).toContainText("다음 과제 보기");

      await page.goto("/my-learning");
      await expect(page.locator('section[aria-labelledby="todo-assign"]')).toContainText("남은 과제 3개");

      await page.goto("/calendar");
      const day = page.locator('section[aria-labelledby="day-heading"]');
      await expect(day).toContainText("레슨 완료");
      await expect(day).toContainText("과제 제출");

      await page.goto("/");
      await expect(nextSteps).toContainText("D-2");
      await expect(nextSteps).not.toContainText("분석 쿼리");
    });

    await test.step("주간 목표 달성 → 새로고침해도 유지", async () => {
      for (const id of ["c7-s1-l2", "c7-s1-l3"]) {
        await page.goto(`/learn/c7?lesson=${id}`);
        await page.getByRole("button", { name: /학습 완료/ }).click();
        await expect(page.locator('section[aria-live="polite"]')).toBeVisible();
      }
      await page.reload();
      await page.goto("/");
      await expect(week).toContainText("5시간 12분");
      await expect(week).toContainText("목표를 달성했어요");
      await expect(goals).toContainText("2/3");
    });
  });
});
