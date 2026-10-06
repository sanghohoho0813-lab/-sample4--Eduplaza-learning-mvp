"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { BarChart3, BookOpen, ChevronRight, ClipboardList, Heart, PlayCircle } from "lucide-react";
import { COURSES, getCourse } from "@/lib/data";
import { dueLabel, useStore } from "@/lib/store";
import { Header } from "@/components/Header";
import { CourseCard, CourseRow } from "@/components/CourseCard";
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
  return (
    <Suspense fallback={null}>
      <MyLearning />
    </Suspense>
  );
}

function MyLearning() {
  const store = useStore();
  const searchParams = useSearchParams();
  const initial = searchParams.get("tab") as Tab | null;
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(
    initial && TABS.some((t) => t.key === initial) ? initial : "all"
  );
  // 탭을 주소에 남겨 강의에 들어갔다 돌아와도 보던 탭이 유지되게 한다
  const selectTab = (key: Tab) => {
    setTab(key);
    router.replace(key === "all" ? "/my-learning" : `/my-learning?tab=${key}`, { scroll: false });
  };

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
      <Header title="내 학습" />

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
              courseId={continueCourse.id}
              priority
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
            <h3 className="mt-0.5 line-clamp-2 font-display text-base font-semibold leading-snug sm:truncate md:text-lg">
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

      {/* 남은 과제 — 가까운 마감 2개만. 전체는 과제 탭에서 */}
      {store.upcomingAssignments.length > 0 && (
        <section className="card mb-6 p-2" aria-labelledby="todo-assign">
          <div className="flex items-center justify-between gap-3 px-3.5 pb-1 pt-2.5">
            <h2 id="todo-assign" className="text-sm font-bold text-forest-950">
              남은 과제 {store.upcomingAssignments.length}개
            </h2>
            {store.upcomingAssignments.length > 2 && (
              <Link
                href="/quiz?tab=assignment"
                className="inline-flex min-h-[40px] items-center gap-0.5 text-sm font-semibold text-forest-600 hover:text-forest-800"
              >
                모두 보기 <ChevronRight size={15} />
              </Link>
            )}
          </div>
          <ul className="divide-y divide-cream-100">
            {store.upcomingAssignments.slice(0, 2).map((u) => (
              <li key={u.assignment.id}>
                <Link
                  href={`/quiz?tab=assignment#${u.assignment.id}`}
                  className="flex min-h-[56px] items-center gap-3 rounded-xl px-3.5 py-2.5 transition-colors hover:bg-cream-50"
                >
                  <ClipboardList size={17} className="shrink-0 text-forest-600" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-forest-950">
                      {u.assignment.title}
                    </span>
                    <span className="block truncate text-xs text-forest-950/50">
                      {getCourse(u.assignment.courseId)?.title}
                    </span>
                  </span>
                  <span
                    className={clsx(
                      "shrink-0 text-xs font-semibold",
                      u.dLeft <= 1 ? "text-amber-600" : "text-forest-950/50"
                    )}
                  >
                    {dueLabel(u.dLeft)}
                  </span>
                  <ChevronRight size={16} className="shrink-0 text-forest-950/30" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 탭 + 리포트 바로가기 */}
      <div className="mb-5 flex items-center justify-between gap-3">
      <div className="-mx-4 min-w-0 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="inline-flex min-w-max rounded-full bg-cream-200 p-1" role="tablist" aria-label="강의 분류">
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
              role="tab"
              aria-selected={tab === key}
              onClick={() => selectTab(key)}
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
      </div>
        <Link
          href="/report"
          className="hidden min-h-[44px] shrink-0 items-center gap-1.5 text-sm font-semibold text-forest-600 hover:text-forest-800 sm:inline-flex"
        >
          <BarChart3 size={15} />
          학습 리포트
        </Link>
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
        <>
          <ul className="space-y-3 sm:hidden">
            {filtered.map((course) => (
              <li key={course.id}>
                <CourseRow course={course} showProgress={tab !== "favorite"} />
              </li>
            ))}
          </ul>
          <div className="hidden grid-cols-2 gap-4 sm:grid xl:grid-cols-3">
            {filtered.map((course) => (
              <CourseCard key={course.id} course={course} showProgress={tab !== "favorite"} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
