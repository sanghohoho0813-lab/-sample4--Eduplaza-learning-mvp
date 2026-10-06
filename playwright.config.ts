import { defineConfig, devices } from "@playwright/test";

// 로컬·CI 공통 E2E 설정.
// - 미리 `npm run build` 해 둔 프로덕션 빌드를 3100 포트로 띄워 검증한다.
// - 브라우저를 따로 받지 않는 환경(사내 샌드박스 등)은 PW_CHROMIUM_PATH로 실행 파일을 지정한다.
const PORT = Number(process.env.E2E_PORT ?? 3100);
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    launchOptions: { executablePath },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: `npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
