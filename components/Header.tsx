"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  ChevronRight,
  ClipboardList,
  CornerDownLeft,
  Flame,
  RotateCcw,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { dueLabel, useStore } from "@/lib/store";
import { groupWeak } from "@/lib/insights";
import { BRAND } from "@/lib/brand";
import { COURSES, getCategory, getInstructor } from "@/lib/data";
import { BrandSymbol } from "./BrandMark";

const MAX_SUGGESTIONS = 5;
const SEEN_KEY = "eduplaza-notice-seen";

interface Notice {
  id: string;
  icon: LucideIcon;
  tone: "amber" | "forest" | "gold";
  title: string;
  detail: string;
  href: string;
}

/** 알림은 따로 저장하지 않고, 지금 학습 상태에서 "챙겨야 할 것"만 뽑는다. */
function useNotices(): Notice[] {
  const store = useStore();
  return useMemo(() => {
    if (!store.ready) return [];
    const list: Notice[] = [];
    for (const u of store.upcomingAssignments.filter((u) => u.dLeft <= 3).slice(0, 2)) {
      list.push({
        id: `due-${u.assignment.id}`,
        icon: ClipboardList,
        tone: "amber",
        title: u.assignment.title,
        detail: u.dLeft < 0 ? "과제 마감이 지났어요" : `과제 ${dueLabel(u.dLeft)}`,
        href: `/quiz?tab=assignment#${u.assignment.id}`,
      });
    }
    const weak = groupWeak(store.weakQuestions)[0];
    if (weak) {
      list.push({
        id: `weak-${weak.quiz.id}-${weak.count}`,
        icon: RotateCcw,
        tone: "forest",
        title: `틀린 문제 ${weak.count}개 다시 풀기`,
        detail: weak.quiz.title,
        href: `/quiz/${weak.quiz.id}?mode=review`,
      });
    }
    const studiedToday = store.todayGoals.some((g) => g.done);
    if (store.streak > 0 && !studiedToday) {
      const course = store.currentCourse();
      const next = course ? store.nextLesson(course.id) : null;
      list.push({
        id: `streak-${store.streak}`,
        icon: Flame,
        tone: "gold",
        title: `${store.streak}일 연속 학습 중이에요`,
        detail: "오늘 레슨 하나로 기록을 이어가세요",
        href: course && next ? `/learn/${course.id}?lesson=${next.id}` : "/my-learning",
      });
    }
    return list;
  }, [store]);
}

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
  const notices = useNotices();
  const [bellOpen, setBellOpen] = useState(false);
  const [seen, setSeen] = useState<string | null>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const bellButtonRef = useRef<HTMLButtonElement>(null);
  const signature = notices.map((n) => n.id).join("|");
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

  useEffect(() => {
    try {
      setSeen(sessionStorage.getItem(SEEN_KEY));
    } catch {
      setSeen(null);
    }
  }, []);
  const unread = notices.length > 0 && seen !== signature;

  // 알림 패널: 바깥 클릭·Esc로 닫기
  useEffect(() => {
    if (!bellOpen) return;
    const onDown = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setBellOpen(false);
        bellButtonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [bellOpen]);

  const toggleBell = () => {
    setBellOpen((o) => !o);
    try {
      sessionStorage.setItem(SEEN_KEY, signature);
    } catch {
      // ignore
    }
    setSeen(signature);
  };

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
      {/* 사이드바가 없는 화면(lg 미만)의 왼쪽 위 — 사이드바와 같은 브랜드 마크 */}
      <Link
        href="/"
        aria-label="EduPlaza 홈"
        className="order-1 mr-auto flex min-w-0 items-center gap-2.5 lg:hidden"
      >
        <BrandSymbol priority className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" />
        <span className="min-w-0">
          <span className="block font-display text-lg font-semibold leading-tight tracking-wide text-forest-950">
            {BRAND.product}
          </span>
          <span className="hidden truncate text-xs leading-tight text-forest-950/68 min-[400px]:block">
            by {BRAND.company}
          </span>
        </span>
      </Link>

      {/* 제목은 lg 미만에서 아래 줄 전체 폭을 쓰고, lg 이상에서는 왼쪽 */}
      <div className="order-3 w-full min-w-0 lg:order-1 lg:w-auto lg:flex-1">
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
          <p className="mt-1.5 text-xs text-forest-950/68 md:text-sm">
            {subtitle}
          </p>
        )}
      </div>

      {/* 알림 패널이 화면 오른쪽 끝에 맞춰 열리도록 이 묶음을 기준점으로 쓴다 */}
      <div className="relative order-2 ml-auto flex items-center gap-2.5 lg:order-3">
        <div ref={boxRef} className="relative hidden sm:block">
          <form onSubmit={submit}>
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-forest-950/68"
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
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-forest-950/68 transition-colors hover:bg-cream-100 hover:text-forest-950"
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
                <p className="px-4 py-5 text-sm text-forest-950/68">
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
                          <span className="block truncate text-xs text-forest-950/68">
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
          href="/courses?focus=search"
          className="btn-press flex h-11 w-11 items-center justify-center rounded-full border border-cream-300 bg-white text-forest-800 sm:hidden"
          aria-label="강의 검색"
        >
          <Search size={18} />
        </Link>
        <div ref={bellRef}>
          <button
            ref={bellButtonRef}
            onClick={toggleBell}
            className="btn-press relative flex h-11 w-11 items-center justify-center rounded-full border border-cream-300 bg-white text-forest-800 sm:h-12 sm:w-12"
            aria-label={unread ? `알림 ${notices.length}개` : "알림"}
            aria-expanded={bellOpen}
            aria-controls="notice-panel"
          >
            <Bell size={18} />
            {unread && (
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-gold-500 ring-2 ring-white" />
            )}
          </button>
          {bellOpen && (
            <div
              id="notice-panel"
              role="region"
              aria-label="알림"
              className="absolute right-0 top-[calc(100%+0.625rem)] z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-card-hover animate-scale-in"
            >
              <p className="border-b border-cream-100 px-4 py-3 text-sm font-bold text-forest-950">
                챙겨야 할 일
              </p>
              {notices.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-forest-950/68">
                  지금은 챙길 일이 없어요. 잘하고 있어요!
                </p>
              ) : (
                <ul className="py-1">
                  {notices.map((n) => {
                    const Icon = n.icon;
                    return (
                      <li key={n.id}>
                        <Link
                          href={n.href}
                          onClick={() => setBellOpen(false)}
                          className="flex min-h-[64px] items-center gap-3 px-4 py-2.5 transition-colors hover:bg-cream-50"
                        >
                          <span
                            className={clsx(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                              n.tone === "amber" && "bg-amber-50 text-amber-600",
                              n.tone === "forest" && "bg-forest-50 text-forest-600",
                              n.tone === "gold" && "bg-gold-300/20 text-gold-600"
                            )}
                          >
                            <Icon size={18} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-forest-950">
                              {n.title}
                            </span>
                            <span className="block truncate text-xs text-forest-950/68">
                              {n.detail}
                            </span>
                          </span>
                          <ChevronRight size={16} className="shrink-0 text-forest-950/68" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
        <Link
          href="/my"
          className="btn-press flex h-11 w-11 items-center justify-center rounded-full sm:h-12 sm:w-12 bg-gradient-to-br from-forest-600 to-forest-800 font-display text-sm font-semibold text-cream-50"
          aria-label="마이페이지"
        >
          {ready ? state.name.charAt(0) : "…"}
        </Link>
      </div>
    </header>
  );
}
