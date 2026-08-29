"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Clock, Heart, PlayCircle, Star, Users } from "lucide-react";
import type { Course } from "@/lib/types";
import {
  CATEGORY_TONE,
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

export function CourseCard({
  course,
  showProgress = false,
}: {
  course: Course;
  showProgress?: boolean;
}) {
  const { isFavorite, toggleFavorite, isEnrolled, courseProgress, courseStatus, nextLesson } =
    useStore();
  const { toast } = useToast();
  const router = useRouter();
  const fav = isFavorite(course.id);
  const enrolled = isEnrolled(course.id);
  const pct = courseProgress(course.id);
  const status = courseStatus(course.id);
  const instructor = getInstructor(course.instructorId);

  const onFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(course.id);
    toast(fav ? "찜 목록에서 제거했어요" : "찜 목록에 저장했어요 ♥", fav ? "info" : "success");
  };

  return (
    <Link
      href={`/courses/${course.id}`}
      className="card group flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
    >
      <div className="relative">
        <CourseThumbnail
          tone={course.thumbnailTone}
          title={course.title}
          courseId={course.id}
          rounded="rounded-none"
        />
        <button
          onClick={onFav}
          aria-label={fav ? "찜 해제" : "찜하기"}
          className="btn-press absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-forest-950/45 backdrop-blur transition-colors hover:bg-forest-950/70"
        >
          <Heart
            size={16}
            className={clsx(
              "transition-all",
              fav ? "fill-gold-300 text-gold-300 animate-check-pop" : "text-cream-50"
            )}
          />
        </button>
        {enrolled && (
          <span
            className={clsx(
              "absolute bottom-3 right-3 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur",
              status === "completed"
                ? "bg-success/90 text-white"
                : "bg-cream-50/95 text-forest-900"
            )}
          >
            {status === "completed" ? "완료" : status === "in_progress" ? "수강중" : "수강 대기"}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
              CATEGORY_TONE[course.categoryId]
            )}
          >
            {getCategory(course.categoryId)?.name}
          </span>
          <span className="truncate text-xs font-medium text-forest-950/45">
            {instructor?.name} · {LEVEL_LABEL[course.level]}
          </span>
        </div>
        <h3 className="mt-1 line-clamp-2 text-[22px] font-bold leading-snug text-forest-950 transition-colors group-hover:text-forest-600">
          {course.title}
        </h3>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-forest-950/55">
          <span className="inline-flex items-center gap-1">
            <Star size={13} className="fill-gold-400 text-gold-400" />
            <b className="font-semibold text-forest-950/80">{course.rating.toFixed(1)}</b>
            ({course.reviewCount})
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={13} />
            {formatMinutes(course.totalMinutes)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users size={13} />
            {course.studentCount.toLocaleString()}명
          </span>
        </div>

        {showProgress && enrolled ? (
          <div className="mt-auto pt-3">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-forest-950/50">진도율</span>
              <span className="font-bold text-forest-700">{pct}%</span>
            </div>
            <ProgressBar value={pct} fillClass={pct >= 100 ? "bg-success" : "bg-forest-600"} />
            {pct < 100 && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const lesson = nextLesson(course.id);
                  router.push(
                    lesson
                      ? `/learn/${course.id}?lesson=${lesson.id}`
                      : `/learn/${course.id}`
                  );
                }}
                className="btn-press mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-full bg-forest-900 text-xs font-bold text-cream-50 transition-colors hover:bg-forest-800"
              >
                <PlayCircle size={16} />
                이어보기
              </button>
            )}
          </div>
        ) : (
          <p className="mt-auto pt-3 text-[22px] font-bold text-forest-950">
            {formatPrice(course.price)}
          </p>
        )}
      </div>
    </Link>
  );
}
