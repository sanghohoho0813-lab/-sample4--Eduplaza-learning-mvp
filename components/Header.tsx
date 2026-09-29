"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, CornerDownLeft, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { useStore } from "@/lib/store";
import { COURSES, getCategory, getInstructor } from "@/lib/data";
import { useToast } from "./Toast";

const MAX_SUGGESTIONS = 5;

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
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  // 강의명 / 강사 / 카테고리 / 태그를 아우르는 실시간 제안
  const suggestions = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (query.length === 0) return [];
    return COURSES.filter((c) => {
      const inst = getInstructor(c.instructorId)?.name ?? "";
      const cat = getCategory(c.categoryId)?.name ?? "";
      return [c.title, c.subtitle, inst, cat, ...c.tags]
        .join(" ")
        .toLowerCase()
        .includes(query);
    }).slice(0, MAX_SUGGESTIONS);
  }, [q]);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const goSearch = (query: string) => {
    setOpen(false);
    setCursor(-1);
    router.push(query ? `/courses?q=${encodeURIComponent(query)}` : "/courses");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cursor >= 0 && suggestions[cursor]) {
      setOpen(false);
      router.push(`/courses/${suggestions[cursor].id}`);
      return;
    }
    goSearch(q.trim());
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => (c + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => (c <= 0 ? suggestions.length - 1 : c - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setCursor(-1);
    }
  };

  return (
    <header className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-4 md:mb-8">
      {/* 모바일에서는 제목이 전체 폭을 쓰도록 액션 버튼을 윗줄로 보낸다 */}
      <div className="order-2 w-full min-w-0 sm:order-1 sm:w-auto sm:flex-1">
        <h1
          className={
            serif
              ? "font-display text-[25px] font-semibold leading-tight text-forest-950 sm:text-[30px] md:text-3xl"
              : "text-[23px] font-bold leading-tight text-forest-950 sm:text-[26px] md:text-2xl"
          }
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-xs text-forest-950/55 md:text-sm">
            {subtitle}
          </p>
        )}
      </div>

      <div className="order-1 ml-auto flex items-center gap-2.5 sm:order-2">
        <div ref={boxRef} className="relative hidden sm:block">
          <form onSubmit={submit}>
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-forest-950/40"
            />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setOpen(true);
                setCursor(-1);
              }}
              onFocus={() => q.trim() && setOpen(true)}
              onKeyDown={onKeyDown}
              placeholder="강의 검색"
              role="combobox"
              aria-label="강의 검색"
              aria-autocomplete="list"
              aria-controls="search-suggestions"
              aria-expanded={open && q.trim().length > 0}
              className="h-12 w-64 rounded-full border border-cream-300 bg-white pl-11 pr-10 text-sm text-forest-950 placeholder:text-forest-950/35 outline-none transition-all focus:w-80 focus:border-forest-400 focus:ring-2 focus:ring-forest-200"
            />
            {q && (
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  setOpen(false);
                }}
                aria-label="검색어 지우기"
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-forest-950/40 transition-colors hover:bg-cream-100 hover:text-forest-950"
              >
                <X size={15} />
              </button>
            )}
          </form>

          {/* 자동완성 드롭다운 */}
          {open && q.trim() && (
            <div
              id="search-suggestions"
              className="absolute right-0 top-14 z-50 w-80 overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-card-hover animate-scale-in">
              {suggestions.length === 0 ? (
                <p className="px-4 py-5 text-sm text-forest-950/50">
                  일치하는 강의가 없어요. 다른 키워드로 찾아볼까요?
                </p>
              ) : (
                <ul className="py-1.5">
                  {suggestions.map((c, i) => (
                    <li key={c.id}>
                      <Link
                        href={`/courses/${c.id}`}
                        onClick={() => setOpen(false)}
                        onMouseEnter={() => setCursor(i)}
                        className={clsx(
                          "flex items-center gap-3 px-4 py-3 transition-colors",
                          cursor === i ? "bg-cream-100" : "hover:bg-cream-50"
                        )}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-forest-100 text-xs font-bold text-forest-700">
                          {getCategory(c.categoryId)?.name}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-forest-950">
                            {c.title}
                          </span>
                          <span className="block truncate text-xs text-forest-950/45">
                            {getInstructor(c.instructorId)?.name} 강사
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <button
                onClick={() => goSearch(q.trim())}
                className="flex w-full items-center justify-between border-t border-cream-100 bg-cream-50 px-4 py-3 text-xs font-semibold text-forest-700 transition-colors hover:bg-cream-100"
              >
                <span>&lsquo;{q.trim()}&rsquo; 전체 검색 결과 보기</span>
                <CornerDownLeft size={14} />
              </button>
            </div>
          )}
        </div>

        <Link
          href="/courses"
          className="btn-press flex h-12 w-12 items-center justify-center rounded-full border border-cream-300 bg-white text-forest-800 sm:hidden"
          aria-label="검색"
        >
          <Search size={18} />
        </Link>
        <button
          onClick={() => toast("새로운 알림이 없어요. 오늘도 화이팅!", "info")}
          className="btn-press relative flex h-12 w-12 items-center justify-center rounded-full border border-cream-300 bg-white text-forest-800"
          aria-label="알림"
        >
          <Bell size={18} />
          <span className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-gold-500" />
        </button>
        <Link
          href="/my"
          className="btn-press flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-forest-600 to-forest-800 font-display text-sm font-semibold text-cream-50"
          aria-label="마이페이지"
        >
          {ready ? state.name.charAt(0) : "…"}
        </Link>
      </div>
    </header>
  );
}
