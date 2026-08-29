"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  BarChart3,
  BookOpen,
  Calendar,
  Compass,
  Home,
  NotebookPen,
  PenSquare,
  User,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { BRAND } from "@/lib/brand";

// 메뉴마다 고유한 색을 주되, 채도를 낮춰 사이드바 톤을 해치지 않게 한다.
// idle: 어두운 배경 위의 은은한 틴트 / active: 밝은 판 위의 또렷한 색.
const NAV = [
  {
    href: "/",
    label: "홈",
    icon: Home,
    idle: "bg-forest-700/70 text-forest-100",
    active: "bg-forest-100 text-forest-700",
  },
  {
    href: "/my-learning",
    label: "내 학습",
    icon: BookOpen,
    idle: "bg-teal-600/40 text-teal-100",
    active: "bg-teal-100 text-teal-600",
  },
  {
    href: "/courses",
    label: "강의 탐색",
    icon: Compass,
    idle: "bg-teal-500/30 text-teal-100",
    active: "bg-teal-50 text-teal-500",
  },
  {
    href: "/quiz",
    label: "퀴즈·과제",
    icon: PenSquare,
    idle: "bg-amber-500/30 text-amber-100",
    active: "bg-amber-100 text-amber-600",
  },
  {
    href: "/report",
    label: "성적·리포트",
    icon: BarChart3,
    idle: "bg-amber-400/25 text-amber-100",
    active: "bg-amber-50 text-amber-500",
  },
  {
    href: "/calendar",
    label: "학습 캘린더",
    icon: Calendar,
    idle: "bg-clay-400/30 text-clay-100",
    active: "bg-clay-100 text-clay-500",
  },
  {
    href: "/notes",
    label: "학습노트",
    icon: NotebookPen,
    idle: "bg-clay-300/25 text-clay-100",
    active: "bg-clay-50 text-clay-400",
  },
  {
    href: "/my",
    label: "마이페이지",
    icon: User,
    idle: "bg-cream-400/25 text-cream-100",
    active: "bg-cream-200 text-forest-700",
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar() {
  const pathname = usePathname();
  const { state, ready } = useStore();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col overflow-y-auto bg-forest-950 lg:flex">
      <Link href="/" className="flex items-center gap-3 px-6 pb-7 pt-7">
        <img
          src={BRAND.symbol}
          alt=""
          aria-hidden
          className="h-11 w-11 shrink-0"
        />
        <span className="min-w-0">
          <span className="block font-display text-xl font-semibold leading-tight tracking-wide text-cream-50">
            EduPlaza
          </span>
          <span className="block text-[16px] leading-tight text-cream-200/50">
            by {BRAND.company}
          </span>
        </span>
      </Link>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ href, label, icon: Icon, idle, active: activeTint }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                active
                  ? "bg-cream-100 text-forest-950 shadow-glow"
                  : "text-cream-200/70 hover:bg-forest-800/70 hover:text-cream-50"
              )}
            >
              <span
                className={clsx(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
                  active ? activeTint : idle
                )}
              >
                <Icon size={19} />
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 px-3 pb-5 pt-4">
        {/* 미래에이아이랩 브랜드 크레딧 — 로고는 밝은 판에 얹어 원본 색을 보존한다 */}
        <div className="rounded-xl border border-forest-800 bg-forest-900/40 p-3">
          <div className="rounded-lg bg-white px-3 py-2.5">
            <img
              src={BRAND.logo}
              alt={`${BRAND.company} 로고`}
              className="h-7 w-auto"
            />
          </div>
          <p className="mt-2.5 px-0.5 text-[16px] leading-snug text-cream-200/55">
            {BRAND.company} 레퍼런스 프로젝트
          </p>
        </div>

        <Link
          href="/my"
          className="flex items-center gap-3 rounded-xl border border-forest-800 bg-forest-900/60 px-4 py-3.5 transition-colors hover:bg-forest-800"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-forest-700 font-display text-base font-semibold text-cream-50">
            {ready ? state.name.charAt(0) : "…"}
          </span>
          <span className="min-w-0">
            <span className="block text-[16px] leading-tight text-cream-200/55">
              {ready ? BRAND.company : " "}
            </span>
            <span className="mt-0.5 block truncate text-sm font-semibold leading-snug text-cream-50">
              {ready ? `${state.name}님` : " "}
            </span>
            <span className="block text-[16px] text-cream-200/60">
              {ready ? `${state.streakDays}일 연속 학습 중 🔥` : " "}
            </span>
          </span>
        </Link>
      </div>
    </aside>
  );
}
