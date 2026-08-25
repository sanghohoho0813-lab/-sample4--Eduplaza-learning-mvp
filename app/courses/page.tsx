"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { RotateCcw, Search, SearchX, SlidersHorizontal, X } from "lucide-react";
import { CATEGORIES, COURSES, LEVEL_LABEL, getCategory, getInstructor } from "@/lib/data";
import type { CategoryId, CourseLevel } from "@/lib/types";
import { Header } from "@/components/Header";
import { CourseCard } from "@/components/CourseCard";
import { EmptyState } from "@/components/EmptyState";

type SortKey = "recommend" | "popular" | "newest" | "rating";
type PriceKey = "all" | "under60" | "60to90" | "over90";
type DurationKey = "all" | "short" | "long";

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

function CoursesContent() {
  const params = useSearchParams();
  const q = (params.get("q") ?? "").trim();

  const [category, setCategory] = useState<CategoryId | "all">(
    (params.get("category") as CategoryId) ?? "all"
  );
  const [level, setLevel] = useState<CourseLevel | "all">("all");
  const [price, setPrice] = useState<PriceKey>("all");
  const [duration, setDuration] = useState<DurationKey>("all");
  const [minRating, setMinRating] = useState<number>(0);
  const [sort, setSort] = useState<SortKey>("recommend");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = COURSES.filter((c) => {
      if (category !== "all" && c.categoryId !== category) return false;
      if (level !== "all" && c.level !== level) return false;
      if (price === "under60" && c.price >= 60000) return false;
      if (price === "60to90" && (c.price < 60000 || c.price >= 90000)) return false;
      if (price === "over90" && c.price < 90000) return false;
      if (duration === "short" && c.totalMinutes > 120) return false;
      if (duration === "long" && c.totalMinutes <= 120) return false;
      if (c.rating < minRating) return false;
      if (q) {
        const inst = getInstructor(c.instructorId)?.name ?? "";
        const cat = getCategory(c.categoryId)?.name ?? "";
        const hay = [c.title, c.subtitle, inst, cat, ...c.tags].join(" ").toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });

    switch (sort) {
      case "popular":
        list = [...list].sort((a, b) => b.studentCount - a.studentCount);
        break;
      case "newest":
        list = [...list].sort(
          (a, b) => Number(b.id.slice(1)) - Number(a.id.slice(1))
        );
        break;
      case "rating":
        list = [...list].sort((a, b) => b.rating - a.rating);
        break;
      default:
        list = [...list].sort(
          (a, b) =>
            b.rating * Math.log10(b.studentCount) -
            a.rating * Math.log10(a.studentCount)
        );
    }
    return list;
  }, [category, level, price, duration, minRating, sort, q]);

  const activeFilterCount =
    (category !== "all" ? 1 : 0) +
    (level !== "all" ? 1 : 0) +
    (price !== "all" ? 1 : 0) +
    (duration !== "all" ? 1 : 0) +
    (minRating > 0 ? 1 : 0);

  const resetFilters = () => {
    setCategory("all");
    setLevel("all");
    setPrice("all");
    setDuration("all");
    setMinRating(0);
  };

  const FilterPanel = (
    <div className="space-y-6">
      <div>
        <h4 className="mb-2.5 text-sm font-bold text-forest-950">카테고리</h4>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={category === "all"} onClick={() => setCategory("all")}>
            전체
          </FilterChip>
          {CATEGORIES.map((c) => (
            <FilterChip
              key={c.id}
              active={category === c.id}
              onClick={() => setCategory(c.id)}
            >
              {c.name}
            </FilterChip>
          ))}
        </div>
      </div>
      <div>
        <h4 className="mb-2.5 text-sm font-bold text-forest-950">난이도</h4>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={level === "all"} onClick={() => setLevel("all")}>
            전체
          </FilterChip>
          {(Object.keys(LEVEL_LABEL) as CourseLevel[]).map((lv) => (
            <FilterChip key={lv} active={level === lv} onClick={() => setLevel(lv)}>
              {LEVEL_LABEL[lv]}
            </FilterChip>
          ))}
        </div>
      </div>
      <div>
        <h4 className="mb-2.5 text-sm font-bold text-forest-950">가격</h4>
        <div className="flex flex-wrap gap-2">
          {PRICES.map((p) => (
            <FilterChip key={p.key} active={price === p.key} onClick={() => setPrice(p.key)}>
              {p.label}
            </FilterChip>
          ))}
        </div>
      </div>
      <div>
        <h4 className="mb-2.5 text-sm font-bold text-forest-950">강의 시간</h4>
        <div className="flex flex-wrap gap-2">
          {DURATIONS.map((d) => (
            <FilterChip
              key={d.key}
              active={duration === d.key}
              onClick={() => setDuration(d.key)}
            >
              {d.label}
            </FilterChip>
          ))}
        </div>
      </div>
      <div>
        <h4 className="mb-2.5 text-sm font-bold text-forest-950">평점</h4>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={minRating === 0} onClick={() => setMinRating(0)}>
            전체
          </FilterChip>
          <FilterChip active={minRating === 4.5} onClick={() => setMinRating(4.5)}>
            ⭐ 4.5 이상
          </FilterChip>
          <FilterChip active={minRating === 4.7} onClick={() => setMinRating(4.7)}>
            ⭐ 4.7 이상
          </FilterChip>
        </div>
      </div>
      {activeFilterCount > 0 && (
        <button
          onClick={resetFilters}
          className="btn-press inline-flex items-center gap-1.5 text-sm font-semibold text-forest-600 hover:text-forest-800"
        >
          <RotateCcw size={14} />
          필터 초기화
        </button>
      )}
    </div>
  );

  return (
    <div className="animate-fade-up">
      <Header
        title="강의 탐색"
        subtitle={
          q
            ? `'${q}' 검색 결과 ${filtered.length}개`
            : "새로운 배움의 기회를 찾아보세요."
        }
      />

      {q && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-forest-200 bg-forest-50 px-4 py-3 text-sm text-forest-800">
          <Search size={15} />
          <span>
            <b>&lsquo;{q}&rsquo;</b>(으)로 검색한 결과예요.
          </span>
        </div>
      )}

      {/* 모바일 필터 바 */}
      <div className="mb-4 flex items-center gap-2 lg:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          className="btn-press inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-cream-300 bg-white px-4 text-sm font-semibold text-forest-950"
        >
          <SlidersHorizontal size={15} />
          필터
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-forest-800 text-[16px] font-bold text-cream-50">
              {activeFilterCount}
            </span>
          )}
        </button>
        <div className="thin-scroll flex flex-1 gap-2 overflow-x-auto pb-1">
          {SORTS.map((s) => (
            <FilterChip key={s.key} active={sort === s.key} onClick={() => setSort(s.key)}>
              {s.label}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[240px,1fr] lg:gap-8">
        {/* PC 사이드 필터 */}
        <aside className="hidden lg:block">
          <div className="card sticky top-6 p-5">{FilterPanel}</div>
        </aside>

        <div>
          {/* PC 정렬 */}
          <div className="mb-4 hidden items-center justify-between lg:flex">
            <p className="text-sm text-forest-950/55">
              총 <b className="text-forest-950">{filtered.length}</b>개의 강의
            </p>
            <div className="flex gap-2">
              {SORTS.map((s) => (
                <FilterChip key={s.key} active={sort === s.key} onClick={() => setSort(s.key)}>
                  {s.label}
                </FilterChip>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="조건에 맞는 강의가 없어요"
              description="필터를 조정하거나 다른 키워드로 검색해보세요."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 모바일 필터 드로어 */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="닫기"
            className="absolute inset-0 bg-forest-950/50 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-cream-50 p-6 pb-10 animate-fade-up">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">필터</h3>
              <button
                onClick={() => setDrawerOpen(false)}
                className="btn-press flex h-10 w-10 items-center justify-center rounded-full bg-cream-200 text-forest-800"
                aria-label="필터 닫기"
              >
                <X size={18} />
              </button>
            </div>
            {FilterPanel}
            <button
              onClick={() => setDrawerOpen(false)}
              className="btn-press mt-6 w-full rounded-full bg-forest-900 py-3.5 text-sm font-bold text-cream-50"
            >
              {filtered.length}개 강의 보기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "btn-press whitespace-nowrap rounded-full border px-3.5 py-2 text-[19px] font-medium transition-colors",
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
