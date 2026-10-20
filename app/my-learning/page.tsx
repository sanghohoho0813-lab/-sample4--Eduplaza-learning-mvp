"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  ChevronRight,
  ClipboardList,
  Clock,
  Heart,
  ListChecks,
  PlayCircle,
  RotateCcw,
} from "lucide-react";
import { COURSES, QUIZZES, courseLessons, formatMinutes, getCategory, getCourse, getInstructor } from "@/lib/data";
import { dueLabel, useStore } from "@/lib/store";
import { coursePace, nextStepCourse } from "@/lib/coach";
import type { Course } from "@/lib/types";
import { Header } from "@/components/Header";
import { CourseCard, CourseRow } from "@/components/CourseCard";
import { CourseThumbnail } from "@/components/Thumbnail";
import { ProgressBar } from "@/components/ProgressBar";
import { EmptyState } from "@/components/EmptyState";
import { relativeWhen } from "@/components/ActivityList";
import { LibrarySkeleton } from "@/components/Skeletons";

type Tab = "all" | "in_progress" | "completed" | "favorite";

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "in_progress", label: "진행중" },
  { key: "completed", label: "완료" },
  { key: "favorite", label: "찜" },
];

export default function MyLearningPage() {
  return (
    <Suspense fallback={<LibrarySkeleton />}>
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

  if (!store.ready) return <LibrarySkeleton />;

  const lastStudied = (id: string) =>
    store.state.enrollments.find((e) => e.courseId === id)?.lastStudiedAt ?? "";
  // 최근에 공부한 강의가 위로
  const byRecent = (a: Course, b: Course) => lastStudied(b.id).localeCompare(lastStudied(a.id));
  const inProgress = enrolledCourses.filter((c) => store.courseStatus(c.id) !== "completed").sort(byRecent);
  const completed = enrolledCourses.filter((c) => store.courseStatus(c.id) === "completed").sort(byRecent);
  const favoriteCourses = store.state.favorites
    .map((id) => COURSES.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const counts: Record<Tab, number> = {
    all: enrolledCourses.length,
    in_progress: inProgress.length,
    completed: completed.length,
    favorite: favoriteCourses.length,
  };

  const continueCourse = store.currentCourse();
  const continueNext = continueCourse ? store.nextLesson(continueCourse.id) : null;
  const continueEnrollment = continueCourse
    ? store.state.enrollments.find((e) => e.courseId === continueCourse.id)
    : null;

  const subtitle =
    enrolledCourses.length > 0
      ? `${inProgress.length}개 진행 중 · ${completed.length}개 완주 · 최근 7일 ${formatMinutes(store.weeklyTotal)}`
      : undefined;

  const list = (courses: Course[]) => (
    <ul className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {courses.map((c) => (
        <LibraryItem key={c.id} course={c} />
      ))}
    </ul>
  );

  return (
    <div className="animate-fade-up">
      <Header title="내 학습" subtitle={subtitle} />

      {/* 이어서 학습 — 가장 최근에 듣던 강의의 다음 레슨 하나 */}
      {continueCourse && continueNext && (
        <Link
          href={`/learn/${continueCourse.id}?lesson=${continueNext.id}`}
          className="group relative mb-6 flex items-center gap-4 overflow-hidden rounded-2xl bg-forest-950 p-4 text-cream-50 shadow-card transition-shadow hover:shadow-card-hover md:gap-5 md:p-5"
        >
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-forest-600/25 blur-3xl" aria-hidden />
          <div className="relative w-24 shrink-0 sm:w-40">
            <CourseThumbnail
              tone={continueCourse.thumbnailTone}
              title={continueCourse.title}
              courseId={continueCourse.id}
              priority
              rounded="rounded-lg sm:rounded-xl"
              sizes="(min-width: 640px) 160px, 96px"
              className="ring-1 ring-cream-50/15"
            />
          </div>
          <div className="relative min-w-0 flex-1">
            <p className="text-xs font-semibold text-gold-300">
              이어서 학습
              {continueEnrollment?.lastStudiedAt && (
                <span className="hidden font-normal text-cream-200/70 sm:inline">
                  {" "}
                  · 마지막 {relativeWhen(continueEnrollment.lastStudiedAt)}
                </span>
              )}
            </p>
            <h2 className="mt-1 line-clamp-2 font-display text-base font-semibold leading-snug md:text-lg">
              {continueNext.title}
            </h2>
            <p className="mt-0.5 truncate text-xs text-cream-200/70">
              {continueCourse.title} · {continueNext.durationMin}분
            </p>
            <div className="mt-2.5 flex items-center gap-2.5">
              <div className="max-w-[220px] flex-1">
                <ProgressBar
                  label="이어서 학습할 강의 진도"
                  value={store.courseProgress(continueCourse.id)}
                  trackClass="bg-forest-800"
                  fillClass="bg-gradient-to-r from-cream-300 to-gold-300"
                  height="h-1.5"
                  animate={false}
                />
              </div>
              <span className="text-xs font-bold">{store.courseProgress(continueCourse.id)}%</span>
            </div>
          </div>
          <span
            className="relative hidden h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cream-100 text-forest-950 transition-transform group-hover:scale-105 sm:flex"
            aria-hidden
          >
            <PlayCircle size={22} />
          </span>
        </Link>
      )}

      {/* 남은 과제 — 가까운 마감 2개만. 전체는 과제 탭에서 */}
      {store.upcomingAssignments.length > 0 && (
        <section className="card mb-7 p-2" aria-labelledby="todo-assign">
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
                    <span className="block truncate text-xs text-forest-950/68">
                      {getCourse(u.assignment.courseId)?.title}
                    </span>
                  </span>
                  <span
                    className={clsx(
                      "shrink-0 text-xs font-semibold",
                      u.dLeft <= 1 ? "text-amber-600" : "text-forest-950/68"
                    )}
                  >
                    {dueLabel(u.dLeft)}
                  </span>
                  <ChevronRight size={16} className="shrink-0 text-forest-950/68" />
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
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                onClick={() => selectTab(key)}
                className={clsx(
                  "btn-press min-h-[44px] rounded-full px-4 text-sm font-bold transition-colors sm:px-5",
                  tab === key ? "bg-forest-950 text-cream-50" : "text-forest-950/68"
                )}
              >
                {label}
                <span className={clsx("ml-1.5 text-xs", tab === key ? "text-cream-200/70" : "text-forest-950/68")}>
                  {counts[key]}
                </span>
              </button>
            ))}
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

      {tab === "favorite" ? (
        favoriteCourses.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="찜한 강의가 없어요"
            description="관심 있는 강의를 저장해보세요. 하트를 누르면 여기에 모여요."
            actionHref="/courses"
            actionLabel="강의 탐색하기"
          />
        ) : (
          <>
            <ul className="space-y-3 sm:hidden">
              {favoriteCourses.map((course) => (
                <li key={course.id}>
                  <CourseRow course={course} showFav />
                </li>
              ))}
            </ul>
            <div className="hidden grid-cols-2 gap-4 sm:grid xl:grid-cols-3">
              {favoriteCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </>
        )
      ) : enrolledCourses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="아직 강의가 없어요"
          description="새로운 배움을 시작해보세요. 첫 강의가 여기에 표시돼요."
          actionHref="/courses"
          actionLabel="강의 탐색하기"
        />
      ) : tab === "all" ? (
        <div className="space-y-9">
          {inProgress.length > 0 && (
            <section aria-labelledby="lib-progress">
              <h2 id="lib-progress" className="mb-3 text-base font-bold text-forest-950">
                듣고 있는 강의 <span className="text-sm font-medium text-forest-950/68">{inProgress.length}</span>
              </h2>
              {list(inProgress)}
            </section>
          )}
          {completed.length > 0 && (
            <section aria-labelledby="lib-done">
              <h2 id="lib-done" className="mb-3 text-base font-bold text-forest-950">
                완주한 강의 <span className="text-sm font-medium text-forest-950/68">{completed.length}</span>
              </h2>
              {list(completed)}
            </section>
          )}
        </div>
      ) : tab === "in_progress" ? (
        inProgress.length === 0 ? (
          <EmptyState
            icon={Award}
            title="듣고 있는 강의를 모두 완주했어요"
            description="다음 단계 강의로 이어가 보세요."
            actionHref="/courses"
            actionLabel="강의 탐색하기"
          />
        ) : (
          list(inProgress)
        )
      ) : completed.length === 0 ? (
        <EmptyState
          icon={Award}
          title="아직 완주한 강의가 없어요"
          description="한 강의를 끝까지 들으면 여기에 모여요. 지금 듣는 강의부터 이어가 볼까요?"
          actionHref="/my-learning?tab=in_progress"
          actionLabel="듣고 있는 강의 보기"
        />
      ) : (
        list(completed)
      )}
    </div>
  );
}

/**
 * 수강 중인 강의 한 줄 — '지금 어디까지 왔고, 다음은 무엇이고, 언제 끝나는지'를 한 카드에.
 * 카드 전체가 아니라 제목·썸네일·버튼이 각각 링크다(버튼이 링크 안에 겹치지 않게).
 */
function LibraryItem({ course }: { course: Course }) {
  const store = useStore();
  const lessons = courseLessons(course);
  const done = lessons.filter((l) => store.lessonStatus(l.id) === "completed").length;
  const pct = store.courseProgress(course.id);
  const finished = pct >= 100;
  const next = store.nextLesson(course.id);
  const enrollment = store.state.enrollments.find((e) => e.courseId === course.id);
  const pace = coursePace(store.state, course);
  const quiz = QUIZZES.find((q) => q.courseId === course.id);
  const best = quiz ? store.bestScore(quiz.id) : null;
  const wrong = quiz ? store.weakQuestions.filter((w) => w.quizId === quiz.id).length : 0;
  const pendingTasks = store.upcomingAssignments.filter((u) => u.assignment.courseId === course.id);
  const step = finished ? nextStepCourse(course) : null;

  const chips: { key: string; icon: typeof Clock; text: string; tone?: "warn" | "good" }[] = [];
  if (!finished) {
    chips.push({
      key: "pace",
      icon: Clock,
      text: pace.etaDays !== null ? `약 ${pace.etaDays}일 뒤 완주 예상` : `남은 ${formatMinutes(pace.remainingMinutes)}`,
    });
  }
  if (quiz) {
    chips.push(
      wrong > 0
        ? { key: "quiz", icon: RotateCcw, text: `퀴즈 오답 ${wrong}개`, tone: "warn" }
        : best !== null
          ? { key: "quiz", icon: ListChecks, text: `퀴즈 최고 ${best}점`, tone: best === 100 ? "good" : undefined }
          : { key: "quiz", icon: ListChecks, text: "퀴즈 아직 안 풂" }
    );
  }
  if (pendingTasks.length > 0) {
    chips.push({
      key: "task",
      icon: ClipboardList,
      text: `과제 ${pendingTasks.length}개 · ${dueLabel(pendingTasks[0].dLeft)}`,
      tone: pendingTasks[0].dLeft <= 1 ? "warn" : undefined,
    });
  }

  const chipList = (className: string) => (
    <ul className={clsx("flex-wrap gap-1.5", className)}>
      {chips.map(({ key, icon: Icon, text, tone }) => (
        <li
          key={key}
          className={clsx(
            "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
            tone === "warn"
              ? "bg-amber-50 text-amber-600"
              : tone === "good"
                ? "bg-gold-300/25 text-gold-600"
                : "bg-cream-100 text-forest-950/72"
          )}
        >
          <Icon size={12} aria-hidden />
          {text}
        </li>
      ))}
    </ul>
  );

  return (
    <li className="card flex flex-col overflow-hidden">
      <div className="flex flex-1 gap-4 p-4 sm:p-5">
        <Link href={`/courses/${course.id}`} className="relative w-28 shrink-0 self-start sm:w-40" tabIndex={-1} aria-hidden>
          <CourseThumbnail
            tone={course.thumbnailTone}
            title={course.title}
            courseId={course.id}
            rounded="rounded-xl"
            sizes="(min-width: 640px) 160px, 112px"
          />
          {finished && (
            <span className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full bg-gold-300 text-forest-950 shadow-card ring-2 ring-white">
              <Award size={18} />
            </span>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-forest-950/68">
            {getCategory(course.categoryId)?.name} · {getInstructor(course.instructorId)?.name} 강사
          </p>
          <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-forest-950 sm:text-base">
            <Link href={`/courses/${course.id}`} className="hover:text-forest-600">
              {course.title}
            </Link>
          </h3>
          <p className="mt-1 line-clamp-1 text-xs text-forest-950/72">
            {finished ? (
              <>
                모든 레슨 완주
                {enrollment?.lastStudiedAt && ` · 마지막 학습 ${relativeWhen(enrollment.lastStudiedAt)}`}
              </>
            ) : next ? (
              <>
                다음 · <span className="font-semibold text-forest-950">{next.title}</span> {next.durationMin}분
              </>
            ) : null}
          </p>
          <div className="mt-2.5 flex items-center gap-2.5">
            <ProgressBar
              label={`${course.title} 진도`}
              value={pct}
              height="h-1.5"
              animate={false}
              fillClass={finished ? "bg-success" : "bg-forest-600"}
            />
            <span className={clsx("shrink-0 text-xs font-bold", finished ? "text-success" : "text-forest-700")}>
              {done}/{lessons.length}
            </span>
          </div>
          {chips.length > 0 && chipList("mt-2.5 hidden sm:flex")}
        </div>
      </div>
      {/* 좁은 화면에서는 상태 칩을 카드 폭 전체로 */}
      {chips.length > 0 && chipList("-mt-1 flex px-4 pb-3.5 sm:hidden")}

      {/* 행동 — 진행 중이면 이어서, 완주했으면 다시 보기와 다음 단계 */}
      <div
        className={clsx(
          "flex items-center justify-between gap-x-3 gap-y-1 border-t border-cream-100 px-4 py-2.5 sm:px-5",
          finished && "flex-wrap"
        )}
      >
        {finished ? (
          <>
            <Link
              href={`/learn/${course.id}?lesson=${lessons[0].id}`}
              className="inline-flex min-h-[40px] items-center gap-1.5 text-sm font-semibold text-forest-700 hover:text-forest-950"
            >
              <RotateCcw size={15} aria-hidden />
              처음부터 다시 보기
            </Link>
            {step && (
              <Link
                href={`/courses/${step.course.id}`}
                className="inline-flex min-h-[40px] min-w-0 items-center gap-1 text-sm font-semibold text-forest-950 hover:text-forest-600"
              >
                <span className="truncate">다음 단계 · {step.course.title}</span>
                <ArrowRight size={15} className="shrink-0" aria-hidden />
              </Link>
            )}
          </>
        ) : (
          <>
            <span className="min-w-0 truncate text-xs text-forest-950/68">
              {enrollment?.lastStudiedAt ? `마지막 학습 ${relativeWhen(enrollment.lastStudiedAt)}` : "아직 시작 전"}
            </span>
            {next && (
              <Link
                href={`/learn/${course.id}?lesson=${next.id}`}
                aria-label={`${course.title} 이어서 학습`}
                className="btn-press inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full bg-forest-900 px-4 text-sm font-bold text-cream-50 transition-colors hover:bg-forest-800"
              >
                <PlayCircle size={16} aria-hidden />
                이어서 학습
              </Link>
            )}
          </>
        )}
      </div>
    </li>
  );
}
