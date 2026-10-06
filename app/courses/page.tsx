"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { ChevronDown, RotateCcw, Search, SearchX, SlidersHorizontal, X } from "lucide-react";
import { CATEGORIES, COURSES, LEVEL_LABEL, getCategory, getInstructor } from "@/lib/data";
import type { CategoryId, CourseLevel } from "@/lib/types";
import { Header } from "@/components/Header";
import { CourseCard, CourseRow } from "@/components/CourseCard";
import { EmptyState } from "@/components/EmptyState";

type SortKey = "recommend" | "popular" | "newest" | "rating";
type PriceKey = "all" | "under60" | "60to90" | "over90";
type DurationKey = "all" | "short" | "long";
type RatingKey = "all" | "4.5" | "4.7";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "recommend", label: "추천순" },
  { key: "popular", label: "인기순" },
  { key: "newest", label: "최신순" },
  { key: "rating", label: "평점순" },
];

const PRICES: { key: PriceKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "under60", label: "6만원 미만" },
  { key: "60to90", label: "6~9만원" },
  { key: "over90", label: "9만원 이상" },
];

const DURATIONS: { key: DurationKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "short", label: "2시간 이하" },
  { key: "long", label: "2시간 초과" },
];

const RATINGS: { key: RatingKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "4.5", label: "4.5 이상" },
  { key: "4.7", label: "4.7 이상" },
];

const LEVELS = Object.keys(LEVEL_LABEL) as CourseLevel[];

function pick<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

/**
 * 필터·정렬·검색어는 모두 URL에 둔다.
 * 강의 상세로 들어갔다가 뒤로 와도 고른 조건이 그대로 남고, 링크로 공유할 수도 있다.
 */
function useCourseQuery() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const q = (params.get("q") ?? "").trim();
  const category = pick<CategoryId | "all">(
    params.get("category"),
    ["all", ...CATEGORIES.map((c) => c.id)],
    "all"
  );
  const level = pick<CourseLevel | "all">(params.get("level"), ["all", ...LEVELS], "all");
  const price = pick<PriceKey>(params.get("price"), PRICES.map((p) => p.key), "all");
  const duration = pick<DurationKey>(params.get("duration"), DURATIONS.map((d) => d.key), "all");
  const rating = pick<RatingKey>(params.get("rating"), RATINGS.map((r) => r.key), "all");
  const sort = pick<SortKey>(params.get("sort"), SORTS.map((s) => s.key), "recommend");

  const update = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      next.delete("focus");
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "" || v === "all" || (k === "sort" && v === "recommend")) next.delete(k);
        else next.set(k, v);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, router, pathname]
  );

  return { params, q, category, level, price, duration, rating, sort, update };
}

function CoursesContent() {
  const { params, q, category, level, price, duration, rating, sort, update } = useCourseQuery();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // 모바일 검색창: 입력은 바로 반영하고, URL은 잠깐 멈췄을 때 갱신한다.
  const [qInput, setQInput] = useState(q);
  const lastWritten = useRef(q);
  useEffect(() => {
    if (q !== lastWritten.current) {
      lastWritten.current = q;
      setQInput(q);
    }
  }, [q]);
  useEffect(() => {
    const value = qInput.trim();
    if (value === lastWritten.current) return;
    const t = setTimeout(() => {
      lastWritten.current = value;
      update({ q: value || null });
    }, 250);
    return () => clearTimeout(t);
  }, [qInput, update]);

  // 헤더의 검색 버튼(모바일)에서 넘어오면 검색창에 바로 포커스
  const focusParam = params.get("focus");
  useEffect(() => {
    if (focusParam !== "search") return;
    searchRef.current?.focus();
    update({ focus: null });
  }, [focusParam, update]);

  const filtered = useMemo(() => {
    const query = q.toLowerCase();
    const minRating = rating === "all" ? 0 : Number(rating);
    const list = COURSES.filter((c) => {
      if (category !== "all" && c.categoryId !== category) return false;
      if (level !== "all" && c.level !== level) return false;
      if (price === "under60" && c.price >= 60000) return false;
      if (price === "60to90" && (c.price < 60000 || c.price >= 90000)) return false;
      if (price === "over90" && c.price < 90000) return false;
      if (duration === "short" && c.totalMinutes > 120) return false;
      if (duration === "long" && c.totalMinutes <= 120) return false;
      if (c.rating < minRating) return false;
      if (query) {
        const inst = getInstructor(c.instructorId)?.name ?? "";
        const cat = getCategory(c.categoryId)?.name ?? "";
        const hay = [c.title, c.subtitle, inst, cat, ...c.tags].join(" ").toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });

    switch (sort) {
      case "popular":
        return [...list].sort((a, b) => b.studentCount - a.studentCount);
      case "newest":
        return [...list].sort((a, b) => Number(b.id.slice(1)) - Number(a.id.slice(1)));
      case "rating":
        return [...list].sort((a, b) => b.rating - a.rating);
      default:
        return [...list].sort(
          (a, b) =>
            b.rating * Math.log10(b.studentCount) - a.rating * Math.log10(a.studentCount)
        );
    }
  }, [category, level, price, duration, rating, sort, q]);

  // 지금 걸려 있는 조건 — 한눈에 보고 하나씩 지울 수 있게 칩으로 보여준다
  const active: { key: string; label: string }[] = [
    ...(q ? [{ key: "q", label: `‘${q}’ 검색` }] : []),
    ...(category !== "all" ? [{ key: "category", label: getCategory(category)?.name ?? "" }] : []),
    ...(level !== "all" ? [{ key: "level", label: LEVEL_LABEL[level] }] : []),
    ...(price !== "all" ? [{ key: "price", label: PRICES.find((p) => p.key === price)!.label }] : []),
    ...(duration !== "all"
      ? [{ key: "duration", label: DURATIONS.find((d) => d.key === duration)!.label }]
      : []),
    ...(rating !== "all" ? [{ key: "rating", label: `평점 ${rating} 이상` }] : []),
  ];
  // 모바일 '필터' 버튼 숫자는 시트 안에 있는 조건만 센다(카테고리는 위 칩 줄에서 바로 보임)
  const sheetFilterCount = active.filter((a) => !["q", "category"].includes(a.key)).length;

  const clearAll = () => {
    setQInput("");
    lastWritten.current = "";
    update({ q: null, category: null, level: null, price: null, duration: null, rating: null });
  };
  const clearFilters = () =>
    update({ category: null, level: null, price: null, duration: null, rating: null });
  const removeChip = (key: string) => {
    if (key === "q") {
      setQInput("");
      lastWritten.current = "";
    }
    update({ [key]: null });
  };

  // 컴포넌트가 아닌 함수로 그려야 칩을 누를 때마다 다시 마운트되며 포커스를 잃지 않는다
  const filterPanel = (withCategory: boolean) => (
    <div className="space-y-6">
      {withCategory && (
        <FilterGroup title="카테고리">
          <FilterChip compact={withCategory} active={category === "all"} onClick={() => update({ category: null })}>
            전체
          </FilterChip>
          {CATEGORIES.map((c) => (
            <FilterChip compact={withCategory} key={c.id} active={category === c.id} onClick={() => update({ category: c.id })}>
              {c.name}
            </FilterChip>
          ))}
        </FilterGroup>
      )}
      <FilterGroup title="난이도">
        <FilterChip compact={withCategory} active={level === "all"} onClick={() => update({ level: null })}>
          전체
        </FilterChip>
        {LEVELS.map((lv) => (
          <FilterChip compact={withCategory} key={lv} active={level === lv} onClick={() => update({ level: lv })}>
            {LEVEL_LABEL[lv]}
          </FilterChip>
        ))}
      </FilterGroup>
      <FilterGroup title="가격">
        {PRICES.map((p) => (
          <FilterChip compact={withCategory} key={p.key} active={price === p.key} onClick={() => update({ price: p.key })}>
            {p.label}
          </FilterChip>
        ))}
      </FilterGroup>
      <FilterGroup title="강의 시간">
        {DURATIONS.map((d) => (
          <FilterChip compact={withCategory} key={d.key} active={duration === d.key} onClick={() => update({ duration: d.key })}>
            {d.label}
          </FilterChip>
        ))}
      </FilterGroup>
      <FilterGroup title="평점">
        {RATINGS.map((r) => (
          <FilterChip compact={withCategory} key={r.key} active={rating === r.key} onClick={() => update({ rating: r.key })}>
            {r.label}
          </FilterChip>
        ))}
      </FilterGroup>
    </div>
  );

  return (
    <div className="animate-fade-up">
      <Header title="강의 찾기" />

      {/* 모바일 검색창 — 헤더 검색칸이 없는 폭에서만 */}
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          searchRef.current?.blur();
        }}
        className="relative mb-4 sm:hidden"
      >
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-forest-950/40"
        />
        <input
          id="course-search"
          ref={searchRef}
          type="search"
          enterKeyHint="search"
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          placeholder="강의명, 강사, 주제로 검색"
          aria-label="강의 검색"
          className="h-14 w-full rounded-2xl border border-cream-300 bg-white pl-12 pr-12 text-sm text-forest-950 outline-none placeholder:text-forest-950/35 focus:border-forest-400 focus:ring-2 focus:ring-forest-200 [&::-webkit-search-cancel-button]:hidden"
        />
        {qInput && (
          <button
            type="button"
            onClick={() => removeChip("q")}
            aria-label="검색어 지우기"
            className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-forest-950/45 hover:bg-cream-100"
          >
            <X size={17} />
          </button>
        )}
      </form>

      {/* 카테고리 — 가장 많이 쓰는 조건이라 사이드 패널이 없는 폭에서는 바로 보이게 */}
      <div
        className="thin-scroll -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 xl:hidden"
        aria-label="카테고리"
      >
        <FilterChip active={category === "all"} onClick={() => update({ category: null })}>
          전체
        </FilterChip>
        {CATEGORIES.map((c) => (
          <FilterChip key={c.id} active={category === c.id} onClick={() => update({ category: c.id })}>
            {c.name}
          </FilterChip>
        ))}
      </div>

      {/* 모바일·태블릿·작은 노트북: 개수 + 필터 + 정렬 한 줄 */}
      <div className="mb-3 flex items-center justify-between gap-2 xl:hidden">
        <p className="text-sm text-forest-950/55" aria-live="polite">
          <b className="text-forest-950">{filtered.length}</b>개 강의
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDrawerOpen(true)}
            className={clsx(
              "btn-press inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-4 text-sm font-semibold",
              sheetFilterCount > 0
                ? "border-forest-900 bg-forest-900 text-cream-50"
                : "border-cream-300 bg-white text-forest-950"
            )}
            aria-haspopup="dialog"
          >
            <SlidersHorizontal size={15} />
            필터{sheetFilterCount > 0 && ` ${sheetFilterCount}`}
          </button>
          <SortSelect value={sort} onChange={(v) => update({ sort: v })} />
        </div>
      </div>

      <div className="xl:grid xl:grid-cols-[248px,minmax(0,1fr)] xl:gap-8">
        {/* 넓은 PC(1280+) 사이드 필터 */}
        <aside className="hidden xl:block" aria-label="강의 필터">
          <div className="card sticky top-6 p-5">
            {filterPanel(true)}
          </div>
        </aside>

        <div className="min-w-0">
          {/* PC 정렬 */}
          <div className="mb-4 hidden items-center justify-between gap-4 xl:flex">
            <p className="text-sm text-forest-950/55" aria-live="polite">
              총 <b className="text-forest-950">{filtered.length}</b>개의 강의
            </p>
            <div className="flex gap-2" role="group" aria-label="정렬">
              {SORTS.map((s) => (
                <FilterChip key={s.key} compact active={sort === s.key} onClick={() => update({ sort: s.key })}>
                  {s.label}
                </FilterChip>
              ))}
            </div>
          </div>

          {/* 적용된 조건 */}
          {active.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {active.map((a) => (
                <button
                  key={a.key}
                  onClick={() => removeChip(a.key)}
                  aria-label={`${a.label} 조건 해제`}
                  className="btn-press inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-forest-50 pl-3.5 pr-2.5 text-sm font-semibold text-forest-800 transition-colors hover:bg-forest-100"
                >
                  {a.label}
                  <X size={15} className="text-forest-800/60" />
                </button>
              ))}
              {active.length > 1 && (
                <button
                  onClick={clearAll}
                  className="btn-press inline-flex min-h-[40px] items-center gap-1 px-2 text-sm font-semibold text-forest-950/50 hover:text-forest-950"
                >
                  <RotateCcw size={14} />
                  모두 지우기
                </button>
              )}
            </div>
          )}

          {filtered.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title={q ? `‘${q}’에 맞는 강의가 없어요` : "조건에 맞는 강의가 없어요"}
              description={
                q
                  ? "철자를 확인하거나 더 짧은 키워드로 찾아보세요."
                  : "조건을 하나씩 줄여보면 더 많은 강의를 볼 수 있어요."
              }
            >
              {q && (
                <button
                  onClick={() => removeChip("q")}
                  className="btn-press inline-flex min-h-[48px] items-center rounded-full bg-forest-900 px-6 text-sm font-bold text-cream-50 transition-colors hover:bg-forest-800"
                >
                  검색어 지우기
                </button>
              )}
              {active.some((a) => a.key !== "q") && (
                <button
                  onClick={clearFilters}
                  className={clsx(
                    "btn-press inline-flex min-h-[48px] items-center rounded-full px-6 text-sm font-bold transition-colors",
                    q
                      ? "border border-cream-300 bg-white text-forest-950/75 hover:bg-cream-50"
                      : "bg-forest-900 text-cream-50 hover:bg-forest-800"
                  )}
                >
                  필터 초기화
                </button>
              )}
            </EmptyState>
          ) : (
            <>
              {/* 모바일: 한 화면에 여러 강의를 훑어보는 목록형 */}
              <ul className="space-y-3 sm:hidden">
                {filtered.map((course) => (
                  <li key={course.id}>
                    <CourseRow course={course} />
                  </li>
                ))}
              </ul>
              <div className="hidden grid-cols-2 gap-4 sm:grid min-[1400px]:grid-cols-3">
                {filtered.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 모바일·태블릿·작은 노트북 필터 시트 */}
      {drawerOpen && (
        <FilterSheet
          count={filtered.length}
          canReset={sheetFilterCount > 0}
          onReset={() => update({ level: null, price: null, duration: null, rating: null })}
          onClose={() => setDrawerOpen(false)}
        >
          {filterPanel(false)}
        </FilterSheet>
      )}
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2.5 text-sm font-bold text-forest-950">{title}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function SortSelect({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  return (
    <label className="relative inline-flex">
      <span className="sr-only">정렬</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        className="btn-press min-h-[44px] appearance-none rounded-full border border-cream-300 bg-white pl-4 pr-10 text-sm font-semibold text-forest-950 outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-200"
      >
        {SORTS.map((s) => (
          <option key={s.key} value={s.key}>
            {s.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-forest-950/50"
      />
    </label>
  );
}

function FilterSheet({
  count,
  canReset,
  onReset,
  onClose,
  children,
}: {
  count: number;
  canReset: boolean;
  onReset: () => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  // 칩을 누를 때마다 부모가 다시 그려져도 포커스가 닫기 버튼으로 튀지 않게, 열릴 때 한 번만
  const closeFn = useRef(onClose);
  closeFn.current = onClose;
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeFn.current();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, []);

  // 화면 전환 애니메이션(transform) 안에 두면 뷰포트가 아니라 본문 기준으로 붙고
  // 하단 탭바 아래로 깔리므로 body로 꺼내 그린다.
  return createPortal(
    <div className="fixed inset-0 z-[60] xl:hidden" role="dialog" aria-modal="true" aria-labelledby="filter-title">
      <button
        aria-label="필터 닫기"
        tabIndex={-1}
        className="absolute inset-0 bg-forest-950/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-3xl bg-cream-50 animate-fade-up">
        <div className="flex items-center justify-between px-6 pb-3 pt-5">
          <h2 id="filter-title" className="font-display text-lg font-semibold">
            필터
          </h2>
          <button
            ref={closeRef}
            onClick={onClose}
            className="btn-press flex h-11 w-11 items-center justify-center rounded-full bg-cream-200 text-forest-800"
            aria-label="필터 닫기"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-4">{children}</div>
        <div className="flex gap-2.5 border-t border-cream-200 bg-white px-6 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
          <button
            onClick={onReset}
            disabled={!canReset}
            className="btn-press inline-flex min-h-[52px] items-center gap-1.5 rounded-full border border-cream-300 px-5 text-sm font-semibold text-forest-950/70 disabled:opacity-40"
          >
            <RotateCcw size={15} />
            초기화
          </button>
          <button
            onClick={onClose}
            className="btn-press min-h-[52px] flex-1 rounded-full bg-forest-900 text-sm font-bold text-cream-50"
          >
            {count}개 강의 보기
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function FilterChip({
  active,
  onClick,
  compact = false,
  children,
}: {
  active: boolean;
  onClick: () => void;
  /** PC 사이드 패널처럼 마우스로 쓰는 좁은 영역용 */
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        "btn-press shrink-0 whitespace-nowrap rounded-full border text-sm font-medium transition-colors",
        compact ? "min-h-[36px] px-3.5" : "min-h-[40px] px-4",
        active
          ? "border-forest-900 bg-forest-900 text-cream-50"
          : "border-cream-300 bg-white text-forest-950/70 hover:border-forest-300"
      )}
    >
      {children}
    </button>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={null}>
      <CoursesContent />
    </Suspense>
  );
}
