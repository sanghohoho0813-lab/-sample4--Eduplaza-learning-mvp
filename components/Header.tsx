"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { useToast } from "./Toast";

export function Header({
  title,
  subtitle,
  serif = false,
}: {
  title: string;
  subtitle?: string;
  serif?: boolean;
}) {
  const router = useRouter();
  const { state, ready } = useStore();
  const { toast } = useToast();
  const [q, setQ] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/courses?q=${encodeURIComponent(query)}` : "/courses");
  };

  return (
    <header className="mb-6 flex flex-wrap items-center gap-3 md:mb-8">
      <div className="min-w-0 flex-1">
        <h1
          className={
            serif
              ? "font-display text-[26px] font-semibold leading-tight text-forest-950 md:text-3xl"
              : "text-xl font-bold text-forest-950 md:text-2xl"
          }
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-forest-950/55">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        <form onSubmit={submit} className="relative hidden sm:block">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-forest-950/40"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="강의·강사·키워드 검색"
            className="h-11 w-56 rounded-full border border-cream-300 bg-white pl-10 pr-4 text-sm text-forest-950 placeholder:text-forest-950/35 outline-none transition-all focus:w-72 focus:border-forest-400 focus:ring-2 focus:ring-forest-200"
          />
        </form>
        <Link
          href="/courses"
          className="btn-press flex h-11 w-11 items-center justify-center rounded-full border border-cream-300 bg-white text-forest-800 sm:hidden"
          aria-label="검색"
        >
          <Search size={18} />
        </Link>
        <button
          onClick={() => toast("새로운 알림이 없어요. 오늘도 화이팅!", "info")}
          className="btn-press relative flex h-11 w-11 items-center justify-center rounded-full border border-cream-300 bg-white text-forest-800"
          aria-label="알림"
        >
          <Bell size={18} />
          <span className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-gold-500" />
        </button>
        <Link
          href="/my"
          className="btn-press flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-forest-600 to-forest-800 font-display text-sm font-semibold text-cream-50"
          aria-label="마이페이지"
        >
          {ready ? state.name.charAt(0) : "…"}
        </Link>
      </div>
    </header>
  );
}
