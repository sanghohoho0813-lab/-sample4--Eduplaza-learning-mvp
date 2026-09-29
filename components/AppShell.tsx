"use client";

/* eslint-disable @next/next/no-img-element */
import { StoreProvider } from "@/lib/store";
import { BRAND } from "@/lib/brand";
import { ToastProvider } from "./Toast";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { SampleBridgeCTA } from "./SampleBridgeCTA";
import { AchievementWatcher } from "./AchievementWatcher";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <ToastProvider>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-forest-950 focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-cream-50"
        >
          본문 바로가기
        </a>
        <AchievementWatcher />
        <Sidebar />
        <main className="min-h-screen pb-28 lg:pb-10 lg:pl-72">
          <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pt-6 sm:px-6 md:pt-8 lg:px-8">
            <div id="main-content" className="flex-1">
              {children}
            </div>

            {/* 샘플 하단 공통 CTA 브릿지 — 상담 / 다른 샘플 / 홈페이지 */}
            <SampleBridgeCTA className="mt-14" />

            {/* 미래에이아이랩 브랜드 푸터 */}
            <footer className="mt-14 border-t border-cream-300/70 pb-4 pt-7">
              <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
                <div className="flex items-center gap-3.5">
                  <img
                    src={BRAND.logo}
                    alt={`${BRAND.company} 로고`}
                    className="h-12 w-auto md:h-14"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-forest-950/70">
                    {BRAND.product}는 {BRAND.company}의 레퍼런스 프로젝트입니다.
                  </p>
                  <p className="mt-1 text-xs text-forest-950/45">
                    © 2026 {BRAND.company} ({BRAND.companyEn}). All rights
                    reserved.
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </main>
        <MobileNav />
      </ToastProvider>
    </StoreProvider>
  );
}
