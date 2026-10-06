// 확인창·폼 검증·중복 행동·설정 저장 등 "실수해도 안전한가"를 본다.
import { expect, isMobile, test } from "./fixtures";

test("노트: 삭제는 확인 후에만, 기본 포커스는 취소, 빈 내용은 저장 불가", async ({ page }) => {
  await page.goto("/notes");
  const cards = page.locator("main ul > li.card");
  await expect(cards.first()).toBeVisible();
  const before = await cards.count();

  await page.getByRole("button", { name: "노트 삭제" }).first().click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText("이 노트를 삭제할까요?");
  await expect(dialog.getByRole("button", { name: "취소" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(cards).toHaveCount(before);

  await page.getByRole("button", { name: "노트 삭제" }).first().click();
  await dialog.getByRole("button", { name: "삭제" }).click();
  await expect(cards).toHaveCount(before - 1);

  await page.getByRole("button", { name: "노트 수정" }).first().click();
  await page.getByLabel("노트 내용 수정").fill("   ");
  await expect(page.getByRole("button", { name: "저장", exact: true })).toBeDisabled();
});

test("노트 작성: 지금 듣는 강의·레슨이 기본 선택", async ({ page }) => {
  await page.goto("/notes");
  await page.getByRole("button", { name: /새 노트 작성/ }).click();
  await expect(page.locator("select").nth(1)).not.toHaveValue("");
});

test("과제: 20자 미만은 제출 불가, 글자 수 안내", async ({ page }) => {
  await page.goto("/quiz?tab=assignment");
  const art = page.locator("article").first();
  await art.getByRole("button", { name: "과제 작성하기" }).click();
  await expect(art.locator("textarea")).toBeFocused();
  await art.locator("textarea").fill("짧음");
  await expect(art.getByRole("button", { name: "제출하기" })).toBeDisabled();
  await expect(art).toContainText("20자 이상");
  await art.locator("textarea").fill("월별 신규 가입자 수를 COUNT와 GROUP BY로 구했습니다.");
  await expect(art.getByRole("button", { name: "제출하기" })).toBeEnabled();
});

test("퀴즈: 도중에 나가면 확인, 결과는 맨 위에서·한 번만 저장", async ({ page }) => {
  await page.goto("/quiz/q3");
  await expect(page.getByText("1/7")).toBeVisible(); // 문제가 준비된 뒤 키보드 입력
  await page.keyboard.press("2");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await expect(page.getByText("2/7")).toBeVisible();
  await page.getByRole("link", { name: /퀴즈 목록/ }).click();
  await expect(page.getByRole("alertdialog")).toContainText("퀴즈를 그만둘까요?");
  await page.keyboard.press("Enter"); // 기본 포커스 = 계속 풀기
  await expect(page).toHaveURL(/\/quiz\/q3/);

  for (let i = 1; i < 7; i++) {
    await expect(page.getByText(`${i + 1}/7`)).toBeVisible();
    await page.keyboard.press("2");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
  }
  await page.keyboard.press("Enter"); // 연타
  await expect(page.getByText(/문항별 결과/)).toBeVisible();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem("eduplaza-state-v3")!).quizResults.filter((r: { quizId: string }) => r.quizId === "q3").length
  );
  expect(saved).toBe(1);
});

test("플레이어: 레슨 주소가 고정되어 완료해도 같은 레슨에 완료 패널", async ({ page }) => {
  await page.goto("/learn/c2");
  await expect(page).toHaveURL(/lesson=c2-/);
  const pinned = new URL(page.url()).searchParams.get("lesson");
  await page.getByRole("button", { name: /학습 완료/ }).click();
  await expect(page.locator('section[aria-live="polite"]')).toContainText("레슨 완료");
  expect(new URL(page.url()).searchParams.get("lesson")).toBe(pinned);
});

test("플레이어(모바일): 스크롤해도 영상 고정", async ({ page }) => {
  test.skip(!isMobile(page), "모바일 sticky 영상");
  await page.goto("/learn/c1");
  await page.evaluate(() => scrollTo(0, 300));
  await expect
    .poll(() => page.evaluate(() => Math.round(document.querySelector("div.sticky")!.getBoundingClientRect().top)))
    .toBe(0);
});

test("마이: 관심분야·알림 설정은 새로고침 후에도 유지, 마지막 관심분야는 못 지움", async ({ page }) => {
  await page.goto("/my");
  const marketing = page.getByRole("button", { name: "마케팅", exact: true });
  await marketing.click();
  await page.getByRole("switch", { name: "신규 강의 소식" }).click();
  await page.reload();
  await expect(marketing).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("switch", { name: "신규 강의 소식" })).toHaveAttribute("aria-checked", "true");

  for (const name of ["AI", "데이터", "디자인", "마케팅"]) {
    await page.getByRole("button", { name, exact: true }).click();
  }
  await expect(page.locator('button[aria-pressed="true"]')).toHaveCount(1);
});

test("마이: 데모 초기화는 확인 후 시드 상태로", async ({ page }) => {
  await page.goto("/my");
  await page.getByRole("button", { name: "마케팅", exact: true }).click();
  await page.getByRole("button", { name: /데모 데이터 초기화/ }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "초기화" }).click();
  await expect(page.locator('button[aria-pressed="true"]')).toHaveCount(3);
});

test("알림 패널: 챙길 일을 보여주고, 확인하면 점이 사라진다", async ({ page }) => {
  await page.goto("/");
  const bell = page.locator('button[aria-controls="notice-panel"]');
  await expect(bell).toHaveAttribute("aria-label", /알림 \d+개/);
  await bell.click();
  await expect(page.locator("#notice-panel")).toContainText("분석 쿼리 작성 연습");
  await page.keyboard.press("Escape");
  await expect(page.locator("#notice-panel")).toBeHidden();
  await expect(bell).toBeFocused();
  await page.goto("/report");
  await expect(page.locator('button[aria-controls="notice-panel"]')).toHaveAttribute("aria-label", "알림");
});

test("다른 탭에서 학습하면 이 탭에도 반영된다", async ({ page, context }) => {
  await page.goto("/my-learning");
  const other = await context.newPage();
  await other.goto("/courses/c4");
  await other.getByRole("button", { name: "수강 시작하기" }).first().click();
  await expect(other).toHaveURL(/\/learn\/c4/);
  await expect(page.getByRole("tab", { name: /전체/ })).toContainText("7");
});

test("손상된 저장 데이터로도 앱이 열린다", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("eduplaza-state-v3", "{broken json"));
  await page.reload();
  await expect(page.locator("main").getByText(/연속 학습 중/).first()).toBeVisible();
  await page.evaluate(() =>
    localStorage.setItem("eduplaza-state-v3", JSON.stringify({ enrollments: [{ courseId: "nope" }], activity: [] }))
  );
  await page.goto("/my-learning");
  await expect(page.getByText("아직 강의가 없어요")).toBeVisible();
});

test("없는 주소는 404, 홈·강의 찾기로 돌아갈 수 있다", async ({ page }) => {
  const res = await page.goto("/nope");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("link", { name: "강의 찾기", exact: true }).last()).toBeVisible();
});

test("'/' 키로 어디서든 강의 검색", async ({ page }) => {
  await page.goto("/report");
  await expect(page.getByRole("heading", { name: "학습 리포트" })).toBeVisible();
  await page.keyboard.press("/");
  if (page.viewportSize()!.width >= 640) {
    await expect(page.getByRole("combobox", { name: "강의 검색" })).toBeFocused();
  }
  // 입력칸 안에서는 '/'를 그대로 입력한다
  await page.goto("/notes");
  await page.getByRole("button", { name: /새 노트 작성/ }).click();
  await page.keyboard.type("a/b");
  await expect(page.locator("textarea").first()).toHaveValue("a/b");
});
