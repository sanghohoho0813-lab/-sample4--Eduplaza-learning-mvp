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

const NAV = [
  { href: "/", label: "홈", icon: Home },
  { href: "/my-learning", label: "내 학습", icon: BookOpen },
  { href: "/courses", label: "강의 탐색", icon: Compass },
  { href: "/quiz", label: "퀴즈·과제", icon: PenSquare },
  { href: "/report", label: "성적·리포트", icon: BarChart3 },
  { href: "/calendar", label: "학습 캘린더", icon: Calendar },
  { href: "/notes", label: "학습노트", icon: NotebookPen },
  { href: "/my", label: "마이페이지", icon: User },
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
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-200",
                active
                  ? "bg-cream-100 text-forest-950 shadow-glow"
                  : "text-cream-200/70 hover:bg-forest-800/70 hover:text-cream-50"
              )}
            >
              <Icon
                size={21}
                className={clsx(
                  "transition-colors",
                  active ? "text-forest-700" : "text-cream-200/50 group-hover:text-cream-100"
                )}
              />
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
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-forest-500 to-forest-700 font-display text-base font-semibold text-cream-50">
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
