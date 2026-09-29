"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useStore } from "@/lib/store";
import { BRAND } from "@/lib/brand";
import { PRIMARY_NAV, isNavActive, matchPath } from "@/lib/nav";

export function Sidebar() {
  const pathname = usePathname();
  const { state, ready, streak } = useStore();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col overflow-y-auto bg-forest-950 lg:flex">
      <Link href="/" className="flex items-center gap-3 px-6 pb-7 pt-7">
        <img src={BRAND.symbol} alt="" aria-hidden className="h-11 w-11 shrink-0" />
        <span className="min-w-0">
          <span className="block font-display text-xl font-semibold leading-tight tracking-wide text-cream-50">
            EduPlaza
          </span>
          <span className="block text-xs leading-tight text-cream-200/50">
            by {BRAND.company}
          </span>
        </span>
      </Link>

      <nav className="flex-1 space-y-1 px-3" aria-label="주 메뉴">
        {PRIMARY_NAV.map((item) => {
          const active = isNavActive(pathname, item);
          const Icon = item.icon;
          return (
            <div key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                  active
                    ? "bg-cream-100 text-forest-950 shadow-glow"
                    : "text-cream-200/75 hover:bg-forest-800/70 hover:text-cream-50"
                )}
              >
                <span
                  className={clsx(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
                    active
                      ? "bg-forest-100 text-forest-700"
                      : "bg-forest-800/60 text-cream-200/70 group-hover:text-cream-50"
                  )}
                >
                  <Icon size={19} />
                </span>
                {item.label}
              </Link>

              {/* 학습 활동 하위 메뉴 — 그룹이 열려 있을 때만 보여 사이드바를 차분하게 유지 */}
              {item.children && active && (
                <ul className="mb-1 ml-[30px] mt-1 space-y-0.5 border-l border-forest-800 pl-4">
                  {item.children.map((child) => {
                    const childActive = matchPath(pathname, child.href);
                    return (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          aria-current={childActive ? "page" : undefined}
                          className={clsx(
                            "block rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                            childActive
                              ? "text-cream-50"
                              : "text-cream-200/55 hover:text-cream-100"
                          )}
                        >
                          {child.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      <div className="space-y-3 px-3 pb-5 pt-4">
        {/* 미래에이아이랩 브랜드 크레딧 */}
        <div className="rounded-xl border border-forest-800 bg-forest-900/40 px-4 py-3.5">
          <img src={BRAND.logoDark} alt={`${BRAND.company} 로고`} className="h-8 w-auto" />
          <p className="mt-2.5 text-xs leading-snug text-cream-200/55">
            {BRAND.company} 레퍼런스 프로젝트
          </p>
        </div>

        <Link
          href="/my"
          className="flex items-center gap-3 rounded-xl border border-forest-800 bg-forest-900/60 px-4 py-3.5 transition-colors hover:bg-forest-800"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-forest-500 to-forest-700 font-display text-base font-semibold text-cream-50">
            {ready ? state.name.charAt(0) : "…"}
          </span>
          <span className="min-w-0">
            <span className="block text-xs leading-tight text-cream-200/55">
              {ready ? BRAND.company : " "}
            </span>
            <span className="mt-0.5 block truncate text-sm font-semibold leading-snug text-cream-50">
              {ready ? `${state.name}님` : " "}
            </span>
            <span className="block text-xs text-cream-200/60">
              {ready ? (streak > 0 ? `${streak}일 연속 학습 중` : "오늘 학습을 시작해보세요") : " "}
            </span>
          </span>
        </Link>
      </div>
    </aside>
  );
}
