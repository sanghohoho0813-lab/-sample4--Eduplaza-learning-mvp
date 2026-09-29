"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import clsx from "clsx";
import {
  ArrowRight,
  Check,
  ChevronRight,
  ClipboardList,
  Flame,
  PlayCircle,
  RotateCcw,
  Target,
} from "lucide-react";
import { WEEKLY_GOAL_MIN, dueLabel, enrolledCourses, useStore } from "@/lib/store";
import { BRAND } from "@/lib/brand";
import { CATEGORIES, COURSES, QUIZZES, formatMinutes, getInstructor } from "@/lib/data";
import { groupWeak, weeklyGoalMessage } from "@/lib/insights";
import { Header } from "@/components/Header";
import { CourseCard } from "@/components/CourseCard";
import { CourseThumbnail } from "@/components/Thumbnail";
import { ProgressBar, ProgressRing } from "@/components/ProgressBar";
import { ActivityList } from "@/components/ActivityList";
import { HomeSkeleton } from "@/components/Skeletons";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "늦은 밤까지 대단해요";
  if (h < 12) return "좋은 아침이에요";
  if (h < 18) return "좋은 오후예요";
  return "좋은 저녁이에요";
}

export default function HomePage() {
  const store = useStore();
  const { ready, state, streak, weeklyTotal, todayGoals, weakQuestions, upcomingAssignments } =
    store;

  if (!ready) return <HomeSkeleton />;

  const current = store.currentCourse();
  const next = current ? store.nextLesson(current.id) : null;
  const weeklyLeft = Math.max(0, WEEKLY_GOAL_MIN - weeklyTotal);
  const doneGoals = todayGoals.filter((g) => g.done).length;
  const studiedToday = todayGoals.some((g) => g.done);

  const subtitle =
    doneGoals === todayGoals.length
      ? "오늘 목표를 모두 달성했어요. 정말 멋져요!"
      : studiedToday
        ? "오늘도 한 걸음 성장했어요. 조금만 더 해볼까요?"
        : streak > 0
          ? `${streak}일 연속 학습 중이에요. 오늘도 이어가볼까요?`
          : "오늘도 한 걸음 성장해볼까요?";

  const continueHref = current && next ? `/learn/${current.id}?lesson=${next.id}` : "/courses";
  const firstWeak = groupWeak(weakQuestions)[0];
  const quizForToday = firstWeak?.quiz ?? QUIZZES.find((q) => store.isEnrolled(q.courseId));
  const goalHref: Record<string, string> = {
    lesson: continueHref,
    quiz: firstWeak
      ? `/quiz/${firstWeak.quiz.id}?mode=review`
      : quizForToday
        ? `/quiz/${quizForToday.id}`
        : "/quiz",
    note: "/notes",
  };

  // 지금 처리하면 좋은 일 — 가까운 마감과 틀린 문제. 없으면 섹션 자체를 숨긴다.
  const soonDue = upcomingAssignments.find((u) => u.dLeft >= 0 && u.dLeft <= 3);
  const hasNextSteps = Boolean(soonDue || firstWeak);

  const others = enrolledCourses(state)
    .filter((c) => c.id !== current?.id && store.courseProgress(c.id) < 100)
    .slice(0, 2);

  const notEnrolled = COURSES.filter((c) => !store.isEnrolled(c.id));
  const recommended = [
    ...notEnrolled.filter((c) => state.interests.includes(c.categoryId)),
    ...notEnrolled
      .filter((c) => !state.interests.includes(c.categoryId))
      .sort((a, b) => b.rating - a.rating),
  ].slice(0, 3);
  const interestNames = state.interests
    .map((id) => CATEGORIES.find((c) => c.id === id)?.name)
    .filter(Boolean)
    .join("·");

  const overall = store.overallProgress();
  const doneCourses = store.completedCourseCount();
  const activeCourses = enrolledCourses(state).filter((c) => store.courseProgress(c.id) < 100).length;

  const lessonReachesGoal = next ? weeklyLeft > 0 && next.durationMin >= weeklyLeft : false;

  // ---- 블록 ----

  const todayGoalsCard = (at: string) => (
    <section className="card p-5 md:p-6" aria-labelledby={`today-goals-${at}`}>
      <div className="mb-3 flex items-center justify-between">
        <h2 id={`today-goals-${at}`} className="flex items-center gap-2 text-base font-bold text-forest-950">
          <Target size={18} className="text-forest-600" />
          오늘의 목표
        </h2>
        <span className="text-sm font-semibold text-forest-950/50">
          {doneGoals}/{todayGoals.length}
        </span>
      </div>
      <ProgressBar
        value={(doneGoals / todayGoals.length) * 100}
        fillClass="bg-success"
        height="h-1.5"
        className="mb-3"
      />
      <ul className="space-y-1.5">
        {todayGoals.map((g) =>
          g.done ? (
            <li
              key={g.id}
              className="flex min-h-[48px] items-center gap-3 rounded-xl bg-forest-50 px-3.5 text-sm text-forest-950/45"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-success text-white">
                <Check size={13} className="animate-check-pop" />
              </span>
              <span className="line-through">{g.label}</span>
            </li>
          ) : (
            <li key={g.id}>
              <Link
                href={goalHref[g.id]}
                className="group flex min-h-[48px] items-center gap-3 rounded-xl border border-cream-200 bg-white px-3.5 text-sm text-forest-950 transition-colors hover:border-forest-300"
              >
                <span className="h-5 w-5 shrink-0 rounded-md border border-cream-400" />
                <span className="flex-1">{g.label}</span>
                <ChevronRight
                  size={16}
                  className="shrink-0 text-forest-950/30 transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </li>
          )
        )}
      </ul>
      <p className="mt-3 text-xs text-forest-950/45">
        {doneGoals === todayGoals.length
          ? "오늘 목표 달성! 내일도 이어가요."
          : "학습하면 자동으로 체크돼요."}
      </p>
    </section>
  );

  const weekCard = (at: string) => (
    <section className="card p-5 md:p-6" aria-labelledby={`week-card-${at}`} data-block="week">
      <div className="mb-3 flex items-center justify-between">
        <h2 id={`week-card-${at}`} className="text-base font-bold text-forest-950">
          이번 주 학습
        </h2>
        <Link href="/report" className="text-sm font-semibold text-forest-600 hover:text-forest-800">
          리포트 보기
        </Link>
      </div>
      <p className="font-display text-2xl font-semibold text-forest-950">
        {formatMinutes(weeklyTotal)}
        <span className="ml-1.5 text-sm font-medium text-forest-950/45">
          / {formatMinutes(WEEKLY_GOAL_MIN)}
        </span>
      </p>
      <ProgressBar
        value={(weeklyTotal / WEEKLY_GOAL_MIN) * 100}
        fillClass={weeklyLeft === 0 ? "bg-success" : "bg-forest-600"}
        className="mt-3"
      />
      <p className="mt-2 text-sm text-forest-950/60">
        {weeklyGoalMessage(weeklyTotal, WEEKLY_GOAL_MIN)}
      </p>
      <div className="mt-4 flex items-center gap-2 border-t border-cream-100 pt-4 text-sm text-forest-950/70">
        <Flame size={16} className="shrink-0 text-gold-500" />
        {streak > 0 ? (
          <span>
            <b className="text-forest-950">{streak}일</b> 연속 학습 중
            {!studiedToday && " · 오늘 학습하면 이어져요"}
          </span>
        ) : (
          <span>오늘 학습하면 연속 기록이 시작돼요</span>
        )}
      </div>
    </section>
  );

  const recentCard = (at: string) => (
    <section className="card p-5 md:p-6" aria-labelledby={`recent-card-${at}`}>
      <h2 id={`recent-card-${at}`} className="mb-1 text-base font-bold text-forest-950">
        최근 학습 기록
      </h2>
      <ActivityList items={state.activity.slice(0, 4)} />
    </section>
  );

  return (
    <div className="animate-fade-up">
      <Header title={`${greeting()}, ${state.name}님`} subtitle={subtitle} serif />

      {/* 미래에이아이랩 브랜드 리본 */}
      <section className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-cream-300/70 bg-white px-4 py-3 shadow-card sm:px-5 sm:py-3.5 md:mb-6">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={BRAND.logo}
            alt={`${BRAND.company} 로고`}
            className="h-10 w-auto shrink-0 md:h-12"
          />
          <span className="hidden h-8 w-px bg-cream-300 sm:block" />
          <p className="hidden text-sm font-semibold text-forest-950/60 sm:block">
            {BRAND.company}이 만든 학습 플랫폼 레퍼런스
          </p>
        </div>
        <span className="chip shrink-0 whitespace-nowrap bg-forest-950 text-xs uppercase tracking-widest text-cream-100">
          Reference
        </span>
      </section>

      {/* 학습 요약 — 카드 4장 대신 한 줄로 */}
      <section
        className="card mb-5 grid grid-cols-3 divide-x divide-cream-200 py-3 md:mb-6 md:py-4"
        aria-label="학습 요약"
      >
        <div className="flex flex-col items-center gap-1.5 px-2 text-center">
          <ProgressRing value={overall} size={56} stroke={6}>
            <span className="text-sm font-bold text-forest-800">{overall}%</span>
          </ProgressRing>
          <span className="text-xs text-forest-950/55">전체 진행률</span>
        </div>
        <div className="flex flex-col items-center justify-center gap-1 px-2 text-center">
          <span className="font-display text-2xl font-semibold text-forest-950">{doneCourses}개</span>
          <span className="text-xs text-forest-950/55">완료한 강의</span>
        </div>
        <div className="flex flex-col items-center justify-center gap-1 px-2 text-center">
          <span className="font-display text-2xl font-semibold text-forest-950">{activeCourses}개</span>
          <span className="text-xs text-forest-950/55">수강 중</span>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr),320px] lg:gap-6 min-[1400px]:grid-cols-[minmax(0,1fr),360px]">
        {/* ---- 메인: 지금 할 공부 ---- */}
        <div className="min-w-0 space-y-5 lg:space-y-6">
          {/* 1. 이어서 학습 — 화면의 유일한 Primary CTA */}
          {current && next ? (
            <section className="relative overflow-hidden rounded-2xl bg-forest-950 p-6 text-cream-50 shadow-card md:p-8">
              <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-forest-600/30 blur-3xl" />
              <div className="relative grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr),220px] md:items-center lg:grid-cols-[minmax(0,1fr),168px] min-[1400px]:grid-cols-[minmax(0,1fr),220px]">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gold-300">이어서 학습</p>
                  <h2 className="mt-2 font-display text-xl font-semibold leading-snug md:text-2xl lg:text-xl min-[1400px]:text-2xl">
                    {current.title}
                  </h2>
                  <p className="mt-2 text-sm text-cream-200/75">
                    다음 레슨 · {next.title} ({next.durationMin}분)
                  </p>
                  <div className="mt-5 max-w-sm">
                    <div className="mb-1.5 flex items-center justify-between text-xs text-cream-200/70">
                      <span>강의 진도</span>
                      <span className="font-bold text-cream-50">
                        {store.courseProgress(current.id)}%
                      </span>
                    </div>
                    <ProgressBar
                      value={store.courseProgress(current.id)}
                      trackClass="bg-forest-800"
                      fillClass="bg-gradient-to-r from-cream-300 to-gold-300"
                    />
                  </div>
                  <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                    <Link
                      href={continueHref}
                      className="btn-press inline-flex min-h-[52px] items-center gap-2 rounded-full bg-cream-100 px-7 text-sm font-bold text-forest-950 transition-colors hover:bg-cream-50"
                    >
                      <PlayCircle size={19} />
                      강의 이어보기
                    </Link>
                    <Link
                      href={`/courses/${current.id}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-cream-200/75 underline-offset-4 hover:text-cream-50 hover:underline"
                    >
                      강의 정보 <ArrowRight size={14} />
                    </Link>
                  </div>
                  {lessonReachesGoal && (
                    <p className="mt-4 text-sm text-gold-300">
                      이 레슨을 마치면 이번 주 목표를 달성해요.
                    </p>
                  )}
                </div>
                <div className="hidden md:block">
                  <CourseThumbnail
                    tone={current.thumbnailTone}
                    title={current.title}
                    courseId={current.id}
                    priority
                    className="ring-1 ring-cream-50/10"
                  />
                  <p className="mt-2 text-xs text-cream-200/50">
                    {getInstructor(current.instructorId)?.name} 강사
                  </p>
                </div>
              </div>
            </section>
          ) : (
            <section className="card flex flex-col items-start justify-center p-8">
              <h2 className="font-display text-xl font-semibold">새로운 배움을 시작해볼까요?</h2>
              <p className="mt-2 text-sm text-forest-950/55">
                관심 있는 강의를 찾아 첫 학습을 시작해보세요.
              </p>
              <Link
                href="/courses"
                className="btn-press mt-5 inline-flex min-h-[52px] items-center rounded-full bg-forest-900 px-7 text-sm font-bold text-cream-50"
              >
                강의 찾기
              </Link>
            </section>
          )}

          {/* 모바일에서는 오늘의 목표를 이어보기 바로 아래에 */}
          <div className="lg:hidden">{todayGoalsCard("m")}</div>

          {/* 2. 지금 처리하면 좋은 일 */}
          {hasNextSteps && (
            <section className="card p-2" aria-label="지금 처리하면 좋은 일">
              <ul className="divide-y divide-cream-100">
                {soonDue && (
                  <li>
                    <Link
                      href={`/quiz?tab=assignment#${soonDue.assignment.id}`}
                      className="group flex min-h-[64px] items-center gap-3.5 rounded-xl px-3.5 py-3 transition-colors hover:bg-cream-50"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                        <ClipboardList size={18} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold text-amber-600">
                          곧 마감 · {dueLabel(soonDue.dLeft)}
                        </span>
                        <span className="block truncate text-sm font-semibold text-forest-950">
                          {soonDue.assignment.title}
                        </span>
                      </span>
                      <span className="hidden shrink-0 text-sm font-semibold text-forest-600 sm:block">
                        과제 제출하기
                      </span>
                      <ChevronRight size={18} className="shrink-0 text-forest-950/30" />
                    </Link>
                  </li>
                )}
                {firstWeak && (
                  <li>
                    <Link
                      href={`/quiz/${firstWeak.quiz.id}?mode=review`}
                      className="group flex min-h-[64px] items-center gap-3.5 rounded-xl px-3.5 py-3 transition-colors hover:bg-cream-50"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest-600">
                        <RotateCcw size={18} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold text-forest-600">
                          취약 영역 · {firstWeak.topics.join(", ")}
                        </span>
                        <span className="block truncate text-sm font-semibold text-forest-950">
                          틀린 문제 {firstWeak.count}개 다시 풀기
                        </span>
                      </span>
                      <span className="hidden shrink-0 text-sm font-semibold text-forest-600 sm:block">
                        복습하기
                      </span>
                      <ChevronRight size={18} className="shrink-0 text-forest-950/30" />
                    </Link>
                  </li>
                )}
              </ul>
            </section>
          )}

          <div className="lg:hidden">{weekCard("m")}</div>

          {/* 3. 함께 듣고 있는 강의 */}
          {others.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-forest-950">함께 듣고 있는 강의</h2>
                <Link
                  href="/my-learning"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-forest-600 hover:text-forest-800"
                >
                  내 학습 <ArrowRight size={14} />
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {others.map((course) => (
                  <CourseCard key={course.id} course={course} showProgress />
                ))}
              </div>
            </section>
          )}

          {/* 4. 추천 */}
          <section>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-forest-950">다음에 들어볼 강의</h2>
                <p className="text-xs text-forest-950/50">관심 분야({interestNames}) 기준 추천</p>
              </div>
              <Link
                href="/courses"
                className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-forest-600 hover:text-forest-800"
              >
                더 찾아보기 <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {recommended.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </section>

          <div className="lg:hidden">{recentCard("m")}</div>
        </div>

        {/* ---- 우측: 오늘·이번 주 상황 (데스크톱) ---- */}
        <aside className="hidden space-y-6 lg:block">
          {todayGoalsCard("d")}
          {weekCard("d")}
          {recentCard("d")}
        </aside>
      </div>
    </div>
  );
}
