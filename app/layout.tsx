import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import Script from "next/script";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  applicationName: "EduPlaza",
  title: {
    default: "EduPlaza by 미래에이아이랩 — 온라인 학습 플랫폼",
    template: "%s | EduPlaza by 미래에이아이랩",
  },
  description:
    "미래에이아이랩(MIRAE AI LAB)이 기획·개발한 학습 플랫폼 레퍼런스. 강의 수강, 학습 진도 관리, 퀴즈와 학습노트까지 EduPlaza에서 시작하세요.",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "EduPlaza by 미래에이아이랩",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 노치·홈 인디케이터 영역까지 그리고, 하단 탭바는 safe-area 만큼 띄운다
  viewportFit: "cover",
  themeColor: "#131F19",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {/* 미래AI랩 데모 공용 뒤로·앞으로 버튼 */}
        <Script src="/mirae-history-nav.js" strategy="beforeInteractive" />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
