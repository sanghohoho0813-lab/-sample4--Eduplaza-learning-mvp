"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarCheck2,
  Check,
  Flame,
  GraduationCap,
  PlayCircle,
  Sparkles,
  Timer,
} from "lucide-react";
import clsx from "clsx";
import { useStore } from "@/lib/store";
import { BRAND } from "@/lib/brand";
import { COURSES, formatMinutes, getInstructor } from "@/lib/data";
import { Header } from "@/components/Header";
import { CourseCard } from "@/components/CourseCard";
import { CourseThumbnail } from "@/components/Thumbnail";
import { ProgressBar, ProgressRing } from "@/components/ProgressBar";
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
  const {
    ready,
    state,
    overallProgress,
    completedCourseCount,
    courseProgress,
    currentCourse,
    nextLesson,
    toggleMission,
  } = store;

  if (!ready) return <HomeSkeleton />;

  const current = currentCourse();
  const currentNext = current ? nextLesson(current.id) : null;
  const weeklyTotal = state.weeklyMinutes.reduce((a, b) => a + b, 0);
  const enrolledCourses = state.enrollments
    .map((e) => COURSES.find((c) => c.id === e.courseId))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  const inProgress = enrolledCourses.filter((c) => courseProgress(c.id) < 100);
  // 관심분야 우선, 부족하면 평점 높은 미수강 강의로 채운다
  const notEnrolled = COURSES.filter(
    (c) => !state.enrollments.some((e) => e.courseId === c.id)
  );
  const byInterest = notEnrolled.filter((c) =>
    state.interests.includes(c.categoryId)
  );
  const recommended = [
    ...byInterest,
    ...notEnrolled
      .filter((c) => !byInterest.includes(c))
      .sort((a, b) => b.rating - a.rating),
  ].slice(0, 3);
  const doneMissions = state.missions.filter((m) => m.done).length;

  return (
    <div className="animate-fade-up">
      <Header
        title={`${greeting()}, ${state.name}님`}
        subtitle="오늘도 성장하는 하루 되세요."
        serif
      />

      {/* 미래에이아이랩 브랜드 리본 */}
      <section className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-cream-300/70 bg-white px-4 py-3 shadow-card sm:px-5 sm:py-3.5 md:mb-6">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={BRAND.logo}
            alt={`${BRAND.company} 로고`}
            className="h-10 w-auto shrink-0 md:h-12"
          />
          <span className="hidden h-8 w-px bg-cream-300 sm:block" />
          <p className="hidden text-xs font-semibold text-forest-950/60 sm:block sm:text-sm">
            {BRAND.company}이 만든 학습 플랫폼 레퍼런스
          </p>
        </div>
        <span className="chip shrink-0 whitespace-nowrap bg-forest-950 text-[16px] uppercase tracking-widest text-cream-100">
          Reference
        </span>
      </section>

      {/* 핵심 지표 */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <div className="card flex flex-col items-start gap-2.5 p-4 md:p-5">
          <ProgressRing value={overallProgress()} size={56} stroke={6}>
            <span className="text-[16px] font-bold text-forest-800">
              {overallProgress()}%
            </span>
          </ProgressRing>
          <div className="min-w-0">
            <p className="text-xs text-forest-950/50">전체 진행률</p>
            <p className="mt-0.5 font-display text-lg font-semibold text-forest-950">
              순항 중
            </p>
          </div>
        </div>
        <div className="card p-4 md:p-5">
          <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
            <Timer size={18} />
          </span>
          <p className="text-xs text-forest-950/50">이번 주 학습시간</p>
          <p className="mt-0.5 font-display text-lg font-semibold text-forest-950">
            {formatMinutes(weeklyTotal)}
          </p>
        </div>
        <div className="card p-4 md:p-5">
          <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-clay-100 text-clay-500">
            <Flame size={18} />
          </span>
          <p className="text-xs text-forest-950/50">연속 학습</p>
          <p className="mt-0.5 font-display text-lg font-semibold text-forest-950">
            {state.streakDays}일째 🔥
          </p>
        </div>
        <div className="card p-4 md:p-5">
          <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <GraduationCap size={18} />
          </span>
          <p className="text-xs text-forest-950/50">완료한 강의</p>
          <p className="mt-0.5 font-display text-lg font-semibold text-forest-950">
            {completedCourseCount()}개
          </p>
        </div>
      </section>

      {/* 이어보기 히어로 + 오늘의 미션 */}
      <section className="mt-6 grid gap-4 lg:grid-cols-[1fr,340px] md:mt-8">
        {current && currentNext ? (
          <div className="relative overflow-hidden rounded-2xl bg-forest-950 p-6 text-cream-50 shadow-card md:p-8">
            <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-forest-600/30 blur-3xl" />
            <div className="absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-gold-500/10 blur-3xl" />
            <div className="relative grid gap-6 md:grid-cols-[1fr,240px] md:items-center">
              <div>
                <span className="chip border border-gold-500/30 bg-forest-900/80 uppercase tracking-wider text-gold-300">
                  수강 중
                </span>
                <h2 className="mt-3 font-display text-2xl font-semibold leading-snug md:text-[28px]">
                  {current.title}
                </h2>
                <p className="mt-2 text-sm text-cream-200/70">
                  다음 레슨 · {currentNext.title}
                </p>
                <div className="mt-5 max-w-sm">
                  <div className="mb-1.5 flex items-center justify-between text-xs text-cream-200/70">
                    <span>진도율</span>
                    <span className="font-bold text-cream-50">
                      {courseProgress(current.id)}%
                    </span>
                  </div>
                  <ProgressBar
                    value={courseProgress(current.id)}
                    trackClass="bg-forest-800"
                    fillClass="bg-gradient-to-r from-cream-300 to-gold-300"
                  />
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link
                    href={`/learn/${current.id}?lesson=${currentNext.id}`}
                    className="btn-press inline-flex min-h-[44px] items-center gap-2 rounded-full bg-cream-100 px-6 py-2.5 text-sm font-bold text-forest-950 transition-colors hover:bg-cream-50"
                  >
                    <PlayCircle size={18} />
                    강의 이어보기
                  </Link>
                  <Link
                    href={`/courses/${current.id}`}
                    className="btn-press inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-cream-200/25 px-5 py-2.5 text-sm font-semibold text-cream-100 transition-colors hover:bg-forest-800"
                  >
                    강의 정보
                    <ArrowRight size={15} />
                  </Link>
                </div>
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
          </div>
        ) : (
          <div className="card flex flex-col items-start justify-center p-8">
            <h2 className="font-display text-xl font-semibold">
              새로운 배움을 시작해볼까요?
            </h2>
            <p className="mt-2 text-sm text-forest-950/55">
              관심 있는 강의를 찾아 첫 학습을 시작해보세요.
            </p>
            <Link
              href="/courses"
              className="btn-press mt-5 rounded-full bg-forest-800 px-6 py-2.5 text-sm font-bold text-cream-50"
            >
              강의 탐색하기
            </Link>
          </div>
        )}

        {/* 오늘의 학습 미션 */}
        <div className="card p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-[22px] font-bold text-forest-950">
              <CalendarCheck2 size={17} className="text-forest-600" />
              오늘의 학습 미션
            </h3>
            <span className="text-xs font-semibold text-forest-950/45">
              {doneMissions}/{state.missions.length}
            </span>
          </div>
          <ProgressBar
            value={(doneMissions / state.missions.length) * 100}
            fillClass="bg-success"
            height="h-1.5"
            className="mb-4"
          />
          <ul className="space-y-2">
            {state.missions.map((m) => (
              <li key={m.id}>
                <button
                  onClick={() => toggleMission(m.id)}
                  className={clsx(
                    "btn-press flex min-h-[48px] w-full items-center gap-3 rounded-xl border px-3.5 text-left text-sm transition-all",
                    m.done
                      ? "border-forest-100 bg-forest-50 text-forest-950/40 line-through"
                      : "border-cream-200 bg-white text-forest-950 hover:border-forest-300"
                  )}
                >
                  <span
                    className={clsx(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                      m.done
                        ? "border-success bg-success text-white"
                        : "border-cream-400 bg-white"
                    )}
                  >
                    {m.done && <Check size={13} className="animate-check-pop" />}
                  </span>
                  {m.label}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-center text-xs text-forest-950/45">
            {doneMissions === state.missions.length
              ? "오늘 목표 달성! 정말 멋져요 🎉"
              : "퀴즈까지 완료하면 오늘 목표 달성!"}
          </p>
        </div>
      </section>

      {/* 내 수강 강의 */}
      <section className="mt-8 md:mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-forest-950">
            <BookOpenCheck size={19} className="text-teal-600" />
            학습 이어가기
          </h2>
          <Link
            href="/my-learning"
            className="inline-flex items-center gap-1 text-sm font-semibold text-forest-600 transition-colors hover:text-forest-800"
          >
            전체 보기 <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {inProgress.slice(0, 3).map((course) => (
            <CourseCard key={course.id} course={course} showProgress />
          ))}
        </div>
      </section>

      {/* 추천 강의 */}
      <section className="mt-8 md:mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-forest-950">
            <Sparkles size={19} className="text-amber-500" />
            {state.name}님을 위한 추천 강의
          </h2>
          <Link
            href="/courses"
            className="inline-flex items-center gap-1 text-sm font-semibold text-forest-600 transition-colors hover:text-forest-800"
          >
            더 찾아보기 <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {recommended.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>
    </div>
  );
}
