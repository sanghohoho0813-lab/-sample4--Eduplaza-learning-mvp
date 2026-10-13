// 모바일에서 실제로 공부하는 흐름: 홈 → 이어서 학습 → 메모·완료 → 터치로 복습 → 과제 → 리포트.
// 화면은 달라도 같은 기록이 홈·퀴즈 결과·리포트에 이어지는지 본다.
import { expect, test } from "./fixtures";

test.describe("모바일 학습 흐름", () => {
  test.skip(({ isMobile }) => !isMobile, "모바일 레이아웃 기준");

  test("홈 → 레슨 완료 → 오답 복습 → 과제 제출 → 리포트", async ({ page }) => {
    const plan = page.locator('section[aria-labelledby="plan-heading-m"]');

    await test.step("홈: 이어서 학습과 오늘 할 일", async () => {
      await page.goto("/");
      const hero = page.locator('section[aria-labelledby="continue-heading"]');
      await expect(hero).toContainText("탐색적 데이터 분석(EDA) 실습");
      await expect(plan).toContainText("0/3 완료");
      await hero.getByRole("link", { name: /이어서 학습/ }).click();
      await expect(page).toHaveURL(/\/learn\/c1\?lesson=c1-s3-l3/);
    });

    await test.step("플레이어: 하단 탭 대신 학습 조작 바, 메모 후 완료", async () => {
      await expect(page.getByRole("navigation", { name: "하단 메뉴" })).toHaveCount(0);
      await page.getByLabel("레슨 메모").fill("결측치는 비율부터 확인하고 처리 기준을 정한다");
      await page.getByRole("button", { name: "메모 저장" }).click();
      await expect(page.getByRole("tabpanel")).toContainText("결측치는 비율부터 확인");

      await page.getByRole("button", { name: /학습 완료/ }).click();
      const panel = page.locator('section[aria-live="polite"]');
      await expect(panel).toContainText("진도가 75%로 올랐어요");
      await expect(panel).toContainText("67% → 75%");
      await expect(panel).toContainText("1/3 완료");
      await expect(panel.getByRole("link", { name: /^다음 레슨 · / })).toBeVisible();
    });

    await test.step("퀴즈: 틀린 문제만 터치로 다시 풀기", async () => {
      await page.goto("/quiz/q1?mode=review");
      for (const [i, option] of [2, 0].entries()) {
        await expect(page.getByText(`${i + 1}/2`)).toBeVisible();
        await page.locator("button[aria-pressed]").nth(option).click();
        await page.getByRole("button", { name: "정답 확인", exact: true }).click();
        await page.getByRole("button", { name: i === 1 ? "결과 보기" : "다음 문제" }).click();
      }
      await expect(page.getByText("틀린 문제를 모두 해결했어요!")).toBeVisible();
      const changes = page.locator("main dl");
      await expect(changes).toContainText("3 → 1개");
      await expect(changes).toContainText("2/3 완료");
    });

    await test.step("과제: 가장 급한 과제 제출", async () => {
      await page.goto("/quiz?tab=assignment");
      const first = page.locator("article").first();
      await expect(first.locator("h3")).toHaveText("분석 쿼리 작성 연습");
      await first.getByRole("button", { name: "과제 작성하기" }).click();
      await first.locator("textarea").fill("월별 신규 가입자 수를 COUNT와 GROUP BY로 구했습니다.");
      await first.getByRole("button", { name: "제출하기" }).click();
      await expect(page.locator("article#a5")).toContainText("제출 완료");
    });

    await test.step("홈: 오늘 할 일 3/3, 다음 마감은 계속 보인다", async () => {
      await page.goto("/");
      await expect(plan).toContainText("3/3 완료");
      await expect(plan).toContainText("D-2");
    });

    await test.step("리포트: 이번 주 요약 → 추천 행동 → 보완할 점·잘하고 있는 점", async () => {
      await page.goto("/report");
      await expect(page.locator("#summary-heading")).toHaveText(/지난주보다 .+ 더 공부했어요/);
      await expect(page.locator('section[aria-labelledby="actions-heading"]')).toContainText(
        "‘판매 데이터 요약 분석’ 제출"
      );
      await expect(page.locator('section[aria-labelledby="improve-heading"]')).toContainText("가장 취약한 영역");
      await expect(page.locator('section[aria-labelledby="good-heading"]')).toContainText(
        "틀린 문제 2개를 복습으로 바로잡았어요"
      );
      await expect(page.locator('section[aria-labelledby="ach-heading"]')).toContainText("4/7 달성");

      const top = async (sel: string) => (await page.locator(sel).boundingBox())!.y;
      expect(await top('section[aria-labelledby="summary-heading"]')).toBeLessThan(
        await top('section[aria-labelledby="actions-heading"]')
      );
    });
  });

  test("강의 상세: 배우는 것·결과물을 보고 하단 고정 버튼으로 바로 수강", async ({ page }) => {
    await page.goto("/courses/c7");
    const main = page.locator("main");
    await expect(main).toContainText("이 강의에서 배우는 것");
    await expect(main).toContainText("하루 30분 기준");
    await expect(main).toContainText("폴더 정리 자동화 스크립트");
    await page.getByRole("button", { name: "수강 시작하기" }).click();
    await expect(page).toHaveURL(/\/learn\/c7\?lesson=c7-s1-l1/);
  });
});
