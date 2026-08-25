"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  BarChart3,
  BookOpen,
  Calendar,
  Compass,
  Home,
  Leaf,
  NotebookPen,
  PenSquare,
  User,
} from "lucide-react";
import { useStore } from "@/lib/store";

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
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-forest-950 lg:flex">
      <Link href="/" className="flex items-center gap-2.5 px-6 pb-8 pt-7">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-500/40 text-gold-300">
          <Leaf size={17} />
        </span>
        <span className="font-display text-lg font-semibold tracking-wide text-cream-50">
          EduPlaza
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
                "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors duration-200",
                active
                  ? "bg-cream-100 text-forest-950 shadow-glow"
                  : "text-cream-200/70 hover:bg-forest-800/70 hover:text-cream-50"
              )}
            >
              <Icon
                size={18}
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

      <div className="px-3 pb-5">
        <Link
          href="/my"
          className="flex items-center gap-3 rounded-xl border border-forest-800 bg-forest-900/60 px-3.5 py-3 transition-colors hover:bg-forest-800"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-forest-500 to-forest-700 font-display text-sm font-semibold text-cream-50">
            {ready ? state.name.charAt(0) : "…"}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-cream-50">
              {ready ? `${state.name}님` : " "}
            </span>
            <span className="block text-xs text-cream-200/60">
              {ready ? `${state.streakDays}일 연속 학습 중 🔥` : " "}
            </span>
          </span>
        </Link>
      </div>
    </aside>
  );
}
