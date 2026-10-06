"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { CheckCircle2, Heart, PlayCircle, Star } from "lucide-react";
import type { Course } from "@/lib/types";
import {
  LEVEL_LABEL,
  formatMinutes,
  formatPrice,
  getCategory,
  getInstructor,
} from "@/lib/data";
import { useStore } from "@/lib/store";
import { useToast } from "./Toast";
import { CourseThumbnail } from "./Thumbnail";
import { ProgressBar } from "./ProgressBar";

/** 카드·행이 같이 쓰는 강의 상태와 동작 */
function useCourseView(course: Course) {
  const store = useStore();
  const { toast } = useToast();
  const router = useRouter();
  const fav = store.isFavorite(course.id);
  const enrolled = store.isEnrolled(course.id);
  const pct = store.courseProgress(course.id);
  const status = store.courseStatus(course.id);

  const onFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    store.toggleFavorite(course.id);
    toast(fav ? "찜 목록에서 뺐어요" : "찜 목록에 담았어요", fav ? "info" : "success");
  };

  const onContinue = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const lesson = store.nextLesson(course.id);
    router.push(lesson ? `/learn/${course.id}?lesson=${lesson.id}` : `/learn/${course.id}`);
  };

  return {
    fav,
    enrolled,
    pct,
    status,
    onFav,
    onContinue,
    category: getCategory(course.categoryId)?.name,
    instructor: getInstructor(course.instructorId)?.name,
  };
}

function Byline({ category, instructor }: { category?: string; instructor?: string }) {
  return (
    <p className="truncate text-xs text-forest-950/50">
      <span className="font-semibold text-forest-700">{category}</span>
      <span aria-hidden> · </span>
      {instructor} 강사
    </p>
  );
}

function Meta({ course }: { course: Course }) {
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-forest-950/55">
      <span className="inline-flex items-center gap-1">
        <Star size={13} className="fill-gold-400 text-gold-400" aria-hidden />
        <b className="font-semibold text-forest-950/80">{course.rating.toFixed(1)}</b>
        <span className="sr-only">점 (수강평 {course.reviewCount}개)</span>
      </span>
      <span aria-hidden>·</span>
      <span>{formatMinutes(course.totalMinutes)}</span>
      <span aria-hidden>·</span>
      <span>{LEVEL_LABEL[course.level]}</span>
    </p>
  );
}

function FavButton({
  fav,
  onClick,
  overlay = false,
}: {
  fav: boolean;
  onClick: (e: React.MouseEvent) => void;
  overlay?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={fav ? "찜 해제" : "찜하기"}
      aria-pressed={fav}
      className={clsx(
        "btn-press flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
        overlay
          ? "bg-forest-950/45 backdrop-blur hover:bg-forest-950/70"
          : "text-forest-950/35 hover:bg-cream-100 hover:text-forest-800"
      )}
    >
      <Heart
        size={overlay ? 17 : 19}
        className={clsx(
          "transition-all",
          fav
            ? overlay
              ? "fill-gold-300 text-gold-300 animate-check-pop"
              : "fill-gold-400 text-gold-400 animate-check-pop"
            : overlay && "text-cream-50"
        )}
      />
    </button>
  );
}

/** 수강 중인 강의는 가격 대신 진행 상황을 보여준다 */
function EnrolledLine({ pct }: { pct: number }) {
  return pct >= 100 ? (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-success">
      <CheckCircle2 size={15} /> 수강 완료
    </span>
  ) : (
    <span className="text-sm font-semibold text-forest-700">수강 중 · 진도 {pct}%</span>
  );
}

export function CourseCard({
  course,
  showProgress = false,
}: {
  course: Course;
  showProgress?: boolean;
}) {
  const v = useCourseView(course);

  return (
    <Link
      href={`/courses/${course.id}`}
      className="card group relative flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
    >
      <div className="relative">
        <CourseThumbnail
          tone={course.thumbnailTone}
          title={course.title}
          courseId={course.id}
          rounded="rounded-none"
        />
        <div className="absolute right-2.5 top-2.5">
          <FavButton fav={v.fav} onClick={v.onFav} overlay />
        </div>
        {v.enrolled && (
          <span
            className={clsx(
              "absolute bottom-3 right-3 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur",
              v.status === "completed" ? "bg-success/90 text-white" : "bg-cream-50/95 text-forest-900"
            )}
          >
            {v.status === "completed" ? "완료" : "수강중"}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <Byline category={v.category} instructor={v.instructor} />
        <h3 className="mt-1 line-clamp-2 text-base font-bold leading-snug text-forest-950 transition-colors group-hover:text-forest-600">
          {course.title}
        </h3>
        <div className="mt-2">
          <Meta course={course} />
        </div>

        {showProgress && v.enrolled ? (
          <div className="mt-auto pt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-forest-950/50">진도율</span>
              <span className={clsx("font-bold", v.pct >= 100 ? "text-success" : "text-forest-700")}>
                {v.pct}%
              </span>
            </div>
            <ProgressBar value={v.pct} fillClass={v.pct >= 100 ? "bg-success" : "bg-forest-600"} />
            {v.pct < 100 && (
              <button
                onClick={v.onContinue}
                className="btn-press mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-full border border-forest-200 text-sm font-semibold text-forest-800 transition-colors hover:border-forest-400 hover:bg-forest-50"
              >
                <PlayCircle size={16} />
                이어보기
              </button>
            )}
          </div>
        ) : (
          <div className="mt-auto pt-3">
            {v.enrolled ? (
              <EnrolledLine pct={v.pct} />
            ) : (
              <p className="text-base font-bold text-forest-950">{formatPrice(course.price)}</p>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

/**
 * 모바일 목록용 가로형 강의 행. 썸네일은 작게, 제목·핵심 정보는 크게 —
 * 한 화면에 여러 강의를 훑어볼 수 있게 한다. 좁은 폭에서 제목이 잘리지 않도록
 * 찜 버튼은 두지 않는다(찜은 강의 상세 하단 바에서).
 */
export function CourseRow({
  course,
  showProgress = false,
}: {
  course: Course;
  showProgress?: boolean;
}) {
  const v = useCourseView(course);
  const progressMode = showProgress && v.enrolled;

  return (
    <Link
      href={`/courses/${course.id}`}
      className="card group relative flex items-center gap-3 p-3 transition-colors hover:bg-cream-50"
    >
      <div className="relative w-28 shrink-0 sm:w-40">
        <CourseThumbnail
          tone={course.thumbnailTone}
          title={course.title}
          courseId={course.id}
          rounded="rounded-xl"
        />
        {v.enrolled && !progressMode && (
          <span
            className={clsx(
              "absolute bottom-1.5 left-1.5 rounded-full px-2 py-0.5 text-xs font-semibold",
              v.status === "completed" ? "bg-success text-white" : "bg-cream-50/95 text-forest-900"
            )}
          >
            {v.status === "completed" ? "완료" : "수강중"}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1 py-0.5">
        <Byline category={v.category} instructor={v.instructor} />
        <h3 className="mt-0.5 line-clamp-2 text-sm font-bold leading-snug text-forest-950">
          {course.title}
        </h3>
        {progressMode ? (
          <div className="mt-2 flex items-center gap-2">
            <ProgressBar
              value={v.pct}
              height="h-1.5"
              animate={false}
              fillClass={v.pct >= 100 ? "bg-success" : "bg-forest-600"}
            />
            <span
              className={clsx(
                "shrink-0 text-xs font-bold",
                v.pct >= 100 ? "text-success" : "text-forest-700"
              )}
            >
              {v.pct}%
            </span>
          </div>
        ) : (
          <>
            <div className="mt-1">
              <Meta course={course} />
            </div>
            <div className="mt-1">
              {v.enrolled ? (
                <EnrolledLine pct={v.pct} />
              ) : (
                <p className="text-sm font-bold text-forest-950">{formatPrice(course.price)}</p>
              )}
            </div>
          </>
        )}
      </div>

      {progressMode ? (
        v.pct < 100 ? (
          <button
            onClick={v.onContinue}
            aria-label={`${course.title} 이어보기`}
            className="btn-press flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest-900 text-cream-50 transition-colors hover:bg-forest-800"
          >
            <PlayCircle size={20} />
          </button>
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center text-success" aria-label="수강 완료">
            <CheckCircle2 size={22} />
          </span>
        )
      ) : null}
    </Link>
  );
}
