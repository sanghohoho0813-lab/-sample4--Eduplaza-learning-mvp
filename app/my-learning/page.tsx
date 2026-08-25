"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { BookOpen, Heart, PlayCircle } from "lucide-react";
import { COURSES } from "@/lib/data";
import { useStore } from "@/lib/store";
import { Header } from "@/components/Header";
import { CourseCard } from "@/components/CourseCard";
import { CourseThumbnail } from "@/components/Thumbnail";
import { ProgressBar } from "@/components/ProgressBar";
import { EmptyState } from "@/components/EmptyState";
import { CourseCardSkeleton } from "@/components/Skeletons";

type Tab = "all" | "in_progress" | "completed" | "favorite";

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "in_progress", label: "진행중" },
  { key: "completed", label: "완료" },
  { key: "favorite", label: "찜" },
];

export default function MyLearningPage() {
  const store = useStore();
  const [tab, setTab] = useState<Tab>("all");

  const enrolledCourses = useMemo(
    () =>
      store.state.enrollments
        .map((e) => COURSES.find((c) => c.id === e.courseId))
        .filter((c): c is NonNullable<typeof c> => Boolean(c)),
    [store.state.enrollments]
  );

  if (!store.ready) {
    return (
      <div>
        <Header title="내 학습" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const favoriteCourses = store.state.favorites
    .map((id) => COURSES.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const filtered =
    tab === "favorite"
      ? favoriteCourses
      : enrolledCourses.filter((c) => {
          const status = store.courseStatus(c.id);
          if (tab === "in_progress") return status !== "completed";
          if (tab === "completed") return status === "completed";
          return true;
        });

  const continueCourse = store.currentCourse();
  const continueNext = continueCourse ? store.nextLesson(continueCourse.id) : null;
  const continueEnrollment = continueCourse
    ? store.state.enrollments.find((e) => e.courseId === continueCourse.id)
    : null;

  return (
    <div className="animate-fade-up">
      <Header
        title="내 학습"
        subtitle="지난번 공부하던 곳에서 이어서 시작하세요."
      />

      {/* 이어보기 배너 */}
      {continueCourse && continueNext && (
        <Link
          href={`/learn/${continueCourse.id}?lesson=${continueNext.id}`}
          className="group mb-6 flex items-center gap-4 overflow-hidden rounded-2xl bg-forest-950 p-4 text-cream-50 shadow-card transition-all hover:shadow-card-hover md:p-5"
        >
          <div className="hidden w-36 shrink-0 sm:block">
            <CourseThumbnail
              tone={continueCourse.thumbnailTone}
              title={continueCourse.title}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-cream-200/60">
              마지막 학습{" "}
              {continueEnrollment?.lastStudiedAt
                ? new Date(continueEnrollment.lastStudiedAt).toLocaleDateString(
                    "ko-KR"
                  )
                : "-"}
            </p>
            <h3 className="mt-0.5 truncate font-display text-[24px] font-semibold md:text-lg">
              {continueCourse.title}
            </h3>
            <p className="mt-0.5 truncate text-xs text-cream-200/70">
              다음 레슨 · {continueNext.title}
            </p>
            <div className="mt-2.5 flex items-center gap-2.5">
              <div className="max-w-[200px] flex-1">
                <ProgressBar
                  value={store.courseProgress(continueCourse.id)}
                  trackClass="bg-forest-800"
                  fillClass="bg-gradient-to-r from-cream-300 to-gold-300"
                  height="h-1.5"
                  animate={false}
                />
              </div>
              <span className="text-xs font-bold">
                {store.courseProgress(continueCourse.id)}%
              </span>
            </div>
          </div>
          <span className="btn-press flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cream-100 text-forest-950 transition-transform group-hover:scale-105">
            <PlayCircle size={22} />
          </span>
        </Link>
      )}

      {/* 탭 */}
      <div className="mb-5 inline-flex rounded-full bg-cream-200 p-1">
        {TABS.map(({ key, label }) => {
          const count =
            key === "favorite"
              ? favoriteCourses.length
              : key === "all"
                ? enrolledCourses.length
                : enrolledCourses.filter((c) =>
                    key === "completed"
                      ? store.courseStatus(c.id) === "completed"
                      : store.courseStatus(c.id) !== "completed"
                  ).length;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={clsx(
                "btn-press min-h-[44px] rounded-full px-4 text-sm font-bold transition-colors sm:px-5",
                tab === key ? "bg-forest-950 text-cream-50" : "text-forest-950/55"
              )}
            >
              {label}
              <span
                className={clsx(
                  "ml-1.5 text-xs",
                  tab === key ? "text-cream-200/60" : "text-forest-950/35"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        tab === "favorite" ? (
          <EmptyState
            icon={Heart}
            title="찜한 강의가 없어요"
            description="관심 있는 강의를 저장해보세요. 하트를 누르면 여기에 모여요."
            actionHref="/courses"
            actionLabel="강의 탐색하기"
          />
        ) : (
          <EmptyState
            icon={BookOpen}
            title="아직 강의가 없어요"
            description="새로운 배움을 시작해보세요. 첫 강의가 여기에 표시돼요."
            actionHref="/courses"
            actionLabel="강의 탐색하기"
          />
        )
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              showProgress={tab !== "favorite"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
