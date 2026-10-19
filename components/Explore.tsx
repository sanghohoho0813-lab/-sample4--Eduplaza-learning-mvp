"use client";

// 강의 찾기의 '둘러보기' — 검색·필터를 걸기 전, 썸네일과 큐레이션으로 먼저 고르게 한다.
// 데이터는 기존 강의 목록에서 계산한 것만 쓴다(인기순 = 수강생 수, 입문 = 난이도·평점).

import Link from "next/link";
import clsx from "clsx";
import {
  BarChart3,
  Briefcase,
  ChevronRight,
  Code2,
  Languages,
  Megaphone,
  Palette,
  Rocket,
  Sparkles,
  Star,
  type LucideIcon,
} from "lucide-react";
import { CATEGORIES, COURSES, LEVEL_LABEL, formatMinutes, getCategory, getInstructor } from "@/lib/data";
import type { CategoryId, Course } from "@/lib/types";
import { useStore } from "@/lib/store";
import { CourseThumbnail } from "./Thumbnail";

const CATEGORY_LOOK: Record<CategoryId, { icon: LucideIcon; tint: string }> = {
  dev: { icon: Code2, tint: "bg-teal-50 text-teal-600" },
  ai: { icon: Sparkles, tint: "bg-forest-50 text-forest-600" },
  data: { icon: BarChart3, tint: "bg-teal-50 text-teal-700" },
  design: { icon: Palette, tint: "bg-clay-50 text-clay-600" },
  marketing: { icon: Megaphone, tint: "bg-amber-50 text-amber-600" },
  business: { icon: Briefcase, tint: "bg-gold-300/25 text-gold-600" },
  career: { icon: Rocket, tint: "bg-forest-50 text-forest-700" },
  language: { icon: Languages, tint: "bg-clay-50 text-clay-500" },
};

export function CategoryTiles({ onPick }: { onPick: (id: CategoryId) => void }) {
  return (
    <section aria-labelledby="cat-heading" className="mb-9">
      <h2 id="cat-heading" className="sr-only">
        분야별로 보기
      </h2>
      <ul className="grid grid-cols-4 gap-x-2 gap-y-4 lg:grid-cols-8 lg:gap-3">
        {CATEGORIES.map((c) => {
          const look = CATEGORY_LOOK[c.id];
          const Icon = look.icon;
          const count = COURSES.filter((x) => x.categoryId === c.id).length;
          return (
            <li key={c.id}>
              <button
                onClick={() => onPick(c.id)}
                aria-label={`${c.name} 강의 ${count}개 보기`}
                className="btn-press group flex w-full flex-col items-center gap-2 rounded-2xl py-1 text-center lg:bg-white lg:py-4 lg:shadow-card lg:transition-shadow lg:hover:shadow-card-hover"
              >
                <span
                  className={clsx(
                    "flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:-translate-y-0.5",
                    look.tint
                  )}
                  aria-hidden
                >
                  <Icon size={24} strokeWidth={1.9} />
                </span>
                <span className="text-sm font-medium text-forest-950">{c.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function RailHeader({
  id,
  title,
  sub,
  action,
}: {
  id: string;
  title: string;
  sub: string;
  action?: { label: string; ariaLabel: string; onClick: () => void };
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 id={id} className="text-lg font-bold text-forest-950">
          {title}
        </h2>
        <p className="mt-0.5 text-sm text-forest-950/68">{sub}</p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          aria-label={action.ariaLabel}
          className="btn-press inline-flex min-h-[44px] shrink-0 items-center gap-0.5 text-sm font-semibold text-forest-700 hover:text-forest-950"
        >
          {action.label}
          <ChevronRight size={16} aria-hidden />
        </button>
      )}
    </div>
  );
}

/**
 * 가로로 넘기는 줄 — 모바일은 다음 카드가 살짝 보이게, 카드가 충분히 넓게 들어가는 폭부터는 한 줄 그리드.
 * (TOP 5는 다섯 장이 한 줄에 여유 있게 들어가는 1400px부터 그리드로 바꾼다)
 */
const RAIL_GRID = {
  four: "xl:mx-0 xl:grid xl:grid-cols-4 xl:gap-5 xl:overflow-visible xl:px-0 xl:pb-0",
  five: "min-[1400px]:mx-0 min-[1400px]:grid min-[1400px]:grid-cols-5 min-[1400px]:gap-5 min-[1400px]:overflow-visible min-[1400px]:px-0 min-[1400px]:pb-0",
};
const RAIL_ITEM = {
  four: "w-[72%] shrink-0 snap-start sm:w-[42%] lg:w-[34%] xl:w-auto",
  five: "w-[72%] shrink-0 snap-start sm:w-[42%] lg:w-[30%] xl:w-[23%] min-[1400px]:w-auto",
};

function Rail({ children, grid }: { children: React.ReactNode; grid: keyof typeof RAIL_GRID }) {
  return (
    <ul
      className={clsx(
        // scroll-padding을 같이 줘야 첫 카드가 화면 가장자리에 붙지 않고 본문 여백에 맞춰 멈춘다
        "thin-scroll -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-8 lg:scroll-px-8 lg:px-8",
        RAIL_GRID[grid]
      )}
    >
      {children}
    </ul>
  );
}

function RankCard({ course, rank }: { course: Course; rank: number }) {
  const store = useStore();
  const status = store.isEnrolled(course.id) ? store.courseStatus(course.id) : null;
  return (
    <Link href={`/courses/${course.id}`} className="group relative block">
      <div className="relative overflow-hidden rounded-2xl shadow-card transition-shadow duration-300 group-hover:shadow-card-hover">
        <CourseThumbnail
          tone={course.thumbnailTone}
          title={course.title}
          courseId={course.id}
          rounded="rounded-2xl"
          sizes="(min-width: 1280px) 18vw, (min-width: 640px) 40vw, 72vw"
          className="transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {status && (
          <span
            className={clsx(
              "absolute bottom-2.5 right-2.5 rounded-full px-2.5 py-1 text-xs font-semibold",
              status === "completed" ? "bg-success text-white" : "bg-cream-50/95 text-forest-900"
            )}
          >
            {status === "completed" ? "완료" : "수강중"}
          </span>
        )}
      </div>
      <div className="mt-3 flex gap-3">
        <span
          className="w-7 shrink-0 text-center font-display text-3xl font-semibold leading-none text-gold-600"
          aria-hidden
        >
          {rank}
        </span>
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-forest-950 group-hover:text-forest-600">
            <span className="sr-only">{rank}위 </span>
            {course.title}
          </h3>
          <p className="mt-1 flex items-center gap-x-1.5 whitespace-nowrap text-xs text-forest-950/68">
            <span className="inline-flex items-center gap-1">
              <Star size={12} className="fill-gold-400 text-gold-400" aria-hidden />
              <b className="font-semibold text-forest-950/80">{course.rating.toFixed(1)}</b>
            </span>
            <span aria-hidden>·</span>
            <span>{course.studentCount.toLocaleString()}명</span>
            <span className="sr-only">수강</span>
          </p>
        </div>
      </div>
    </Link>
  );
}

/** 이미지 위주의 큐레이션 카드 — 제목·강사·핵심 정보만 */
function PickCard({ course }: { course: Course }) {
  const store = useStore();
  const status = store.isEnrolled(course.id) ? store.courseStatus(course.id) : null;
  return (
    <Link href={`/courses/${course.id}`} className="group relative block">
      <div className="relative overflow-hidden rounded-2xl shadow-card transition-shadow duration-300 group-hover:shadow-card-hover">
        <CourseThumbnail
          tone={course.thumbnailTone}
          title={course.title}
          courseId={course.id}
          rounded="rounded-2xl"
          sizes="(min-width: 1280px) 22vw, (min-width: 640px) 40vw, 72vw"
          className="transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {status && (
          <span
            className={clsx(
              "absolute bottom-2.5 right-2.5 rounded-full px-2.5 py-1 text-xs font-semibold",
              status === "completed" ? "bg-success text-white" : "bg-cream-50/95 text-forest-900"
            )}
          >
            {status === "completed" ? "완료" : "수강중"}
          </span>
        )}
      </div>
      <p className="mt-3 truncate text-xs text-forest-950/68">
        {getCategory(course.categoryId)?.name} · {getInstructor(course.instructorId)?.name} 강사
      </p>
      <h3 className="mt-0.5 line-clamp-2 text-base font-semibold leading-snug text-forest-950 group-hover:text-forest-600">
        {course.title}
      </h3>
      <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-forest-950/68">
        <span className="inline-flex items-center gap-1">
          <Star size={12} className="fill-gold-400 text-gold-400" aria-hidden />
          <b className="font-semibold text-forest-950/80">{course.rating.toFixed(1)}</b>
        </span>
        <span aria-hidden>·</span>
        <span>{formatMinutes(course.totalMinutes)}</span>
        <span aria-hidden>·</span>
        <span>{LEVEL_LABEL[course.level]}</span>
      </p>
    </Link>
  );
}

export function BrowseRails({
  onPopular,
  onBeginner,
}: {
  onPopular: () => void;
  onBeginner: () => void;
}) {
  const popular = [...COURSES].sort((a, b) => b.studentCount - a.studentCount).slice(0, 5);
  const beginner = COURSES.filter((c) => c.level === "beginner")
    .sort((a, b) => b.rating - a.rating || b.studentCount - a.studentCount)
    .slice(0, 4);

  return (
    <>
      <section aria-labelledby="popular-heading" className="mb-10">
        <RailHeader
          id="popular-heading"
          title="지금 많이 듣는 강의"
          sub="수강생 수 기준 TOP 5"
          action={{ label: "전체", ariaLabel: "인기순으로 전체 강의 보기", onClick: onPopular }}
        />
        <Rail grid="five">
          {popular.map((c, i) => (
            <li key={c.id} className={RAIL_ITEM.five}>
              <RankCard course={c} rank={i + 1} />
            </li>
          ))}
        </Rail>
      </section>

      <section aria-labelledby="beginner-heading" className="mb-10">
        <RailHeader
          id="beginner-heading"
          title="처음이라면 여기서부터"
          sub="입문 강의 중 평점이 높은 순"
          action={{ label: "전체", ariaLabel: "입문 강의 전체 보기", onClick: onBeginner }}
        />
        <Rail grid="four">
          {beginner.map((c) => (
            <li key={c.id} className={RAIL_ITEM.four}>
              <PickCard course={c} />
            </li>
          ))}
        </Rail>
      </section>
    </>
  );
}
