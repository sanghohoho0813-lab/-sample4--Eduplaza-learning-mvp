"use client";

import Link from "next/link";
import clsx from "clsx";
import {
  ArrowRight,
  BookOpenCheck,
  Check,
  ClipboardList,
  Flame,
  NotebookPen,
  PenSquare,
  PlayCircle,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import { WEEKLY_GOAL_MIN, dueLabel, enrolledCourses, useStore } from "@/lib/store";
import { BRAND } from "@/lib/brand";
import { courseLessons, formatMinutes, getInstructor } from "@/lib/data";
import { groupWeak, weeklyGoalMessage } from "@/lib/insights";
import { compareWeeks, recommendCourses, type PlanItem, type PlanKind } from "@/lib/coach";
import { Header } from "@/components/Header";
import { CourseCard, CourseRow } from "@/components/CourseCard";
import { CourseThumbnail } from "@/components/Thumbnail";
import { ProgressBar } from "@/components/ProgressBar";
import { HomeSkeleton } from "@/components/Skeletons";
import { BrandLogo } from "@/components/BrandMark";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "늦은 밤까지 대단해요";
  if (h < 12) return "좋은 아침이에요";
  if (h < 18) return "좋은 오후예요";
  return "좋은 저녁이에요";
}

const KIND: Record<PlanKind, { icon: LucideIcon; label: string }> = {
  lesson: { icon: PlayCircle, label: "레슨" },
  review: { icon: RotateCcw, label: "복습" },
  quiz: { icon: PenSquare, label: "퀴즈" },
  assignment: { icon: ClipboardList, label: "과제" },
  note: { icon: NotebookPen, label: "메모" },
};

const clock = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

/** 10분 안에 끝낸 일은 "방금"으로 — 방금 한 행동이 홈에 반영됐다는 걸 느끼게 */
const isRecent = (iso?: string) =>
  Boolean(iso) && Date.now() - new Date(iso!).getTime() < 10 * 60 * 1000;

export default function HomePage() {
  const store = useStore();
  const { ready, state, streak, weeklyTotal, last7, todayPlan, studiedToday } = store;

  if (!ready) return <HomeSkeleton />;

  const current = store.currentCourse();
  const next = current ? store.nextLesson(current.id) : null;
  const lessons = current ? courseLessons(current) : [];
  const doneLessons = current
    ? lessons.filter((l) => store.lessonStatus(l.id) === "completed").length
    : 0;
  const weeklyLeft = Math.max(0, WEEKLY_GOAL_MIN - weeklyTotal);
  const planDone = todayPlan.filter((p) => p.done).length;
  const allDone = planDone === todayPlan.length;
  const week = compareWeeks(state.activity);

  const subtitle = allDone
    ? "오늘 할 일을 모두 마쳤어요. 정말 잘했어요!"
    : studiedToday
      ? `오늘 할 일이 ${todayPlan.length - planDone}개 남았어요.`
      : streak > 0
        ? `${streak}일 연속 학습 중이에요. 오늘도 이어가볼까요?`
        : "오늘의 첫 레슨부터 시작해볼까요?";

  const enrolled = enrolledCourses(state);
  const inProgress = enrolled.filter((c) => store.courseProgress(c.id) < 100);
  const completedCount = enrolled.length - inProgress.length;
  const others = inProgress.filter((c) => c.id !== current?.id).slice(0, 3);
  const recs = recommendCourses(state, 3);
  const lessonReachesGoal = next ? weeklyLeft > 0 && next.durationMin >= weeklyLeft : false;
  const maxDay = Math.max(1, ...last7.map((d) => d.minutes));

  // 오늘 할 일에 들어가지 못한 마감·오답 — 하나를 끝내도 다음 차례가 홈에서 사라지지 않게
  const planHrefs = new Set(todayPlan.map((p) => p.href));
  const later = [
    ...store.upcomingAssignments
      .filter((u) => u.dLeft <= 7 && !planHrefs.has(`/quiz?tab=assignment#${u.assignment.id}`))
      .map((u) => ({
        key: u.assignment.id,
        kind: "마감",
        title: u.assignment.title,
        meta: dueLabel(u.dLeft),
        href: `/quiz?tab=assignment#${u.assignment.id}`,
        urgent: u.dLeft <= 1,
      })),
    ...groupWeak(store.weakQuestions)
      .filter((g) => !planHrefs.has(`/quiz/${g.quiz.id}?mode=review`))
      .map((g) => ({
        key: g.quiz.id,
        kind: "복습",
        title: g.topics.join(", "),
        meta: `틀린 문제 ${g.count}개`,
        href: `/quiz/${g.quiz.id}?mode=review`,
        urgent: false,
      })),
  ].slice(0, 2);

  // ---- 블록 (모바일·데스크톱에서 위치만 달라 두 번 그린다 — id는 접미사로 구분) ----

  const planBlock = (at: string) => (
    <section aria-labelledby={`plan-heading-${at}`} data-block="plan">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id={`plan-heading-${at}`} className="text-lg font-bold text-forest-950">
          오늘 할 일
        </h2>
        <span className="text-sm font-semibold text-forest-950/68">
          {planDone}/{todayPlan.length} 완료
        </span>
      </div>
      <ol className="card divide-y divide-cream-100 overflow-hidden">
        {todayPlan.map((item) => (
          <PlanRow key={item.id} item={item} />
        ))}
      </ol>
      {later.length > 0 && (
        <ul className="mt-2 px-1" aria-label="이어서 챙길 일">
          {later.map((l) => (
            <li key={l.key}>
              <Link
                href={l.href}
                className="flex min-h-[40px] items-center justify-between gap-3 text-sm text-forest-950/72 hover:text-forest-950"
              >
                <span className="min-w-0 truncate">
                  <span className="font-semibold text-forest-950/68">{l.kind}</span> · {l.title}
                </span>
                <span className={clsx("shrink-0 text-xs font-semibold", l.urgent ? "text-amber-600" : "text-forest-950/68")}>
                  {l.meta}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {allDone && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-forest-950/72">
          <Flame size={15} className="text-gold-500" aria-hidden />
          {streak}일 연속 학습 — 내일도 이어가요.
        </p>
      )}
    </section>
  );

  const weekBlock = (at: string) => (
    <section aria-labelledby={`week-heading-${at}`} data-block="week">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id={`week-heading-${at}`} className="text-lg font-bold text-forest-950">
          이번 주
        </h2>
        <Link
          href="/report"
          className="inline-flex min-h-[40px] items-center gap-1 text-sm font-semibold text-forest-700 hover:text-forest-900"
        >
          리포트 <ArrowRight size={14} />
        </Link>
      </div>
      <div className="card p-5">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="whitespace-nowrap font-display text-xl font-semibold text-forest-950 sm:text-2xl">
              {formatMinutes(weeklyTotal)}
              <span className="ml-1.5 text-sm font-medium text-forest-950/68">
                / {formatMinutes(WEEKLY_GOAL_MIN)}
              </span>
            </p>
            <p className="mt-1 text-sm text-forest-950/72">
              {weeklyGoalMessage(weeklyTotal, WEEKLY_GOAL_MIN)}
            </p>
          </div>
          {/* 최근 7일 막대 — 오늘이 오른쪽 끝 */}
          <div
            className="flex h-12 shrink-0 items-end gap-1"
            role="img"
            aria-label={`최근 7일 학습 시간: ${last7.map((d) => `${d.label}요일 ${d.minutes}분`).join(", ")}`}
          >
            {last7.map((d) => (
              <span
                key={d.key}
                className={clsx("w-2.5 rounded-sm", d.isToday ? "bg-forest-700" : "bg-forest-200")}
                style={{ height: `${Math.max(d.minutes > 0 ? 18 : 6, (d.minutes / maxDay) * 100)}%` }}
              />
            ))}
          </div>
        </div>
        <ProgressBar
          label="이번 주 목표 달성률"
          value={(weeklyTotal / WEEKLY_GOAL_MIN) * 100}
          fillClass={weeklyLeft === 0 ? "bg-success" : "bg-forest-600"}
          height="h-1.5"
          className="mt-4"
        />
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-forest-950/80">
          <li className="flex items-center gap-1.5">
            <Flame size={15} className="text-gold-500" aria-hidden />
            {streak > 0 ? (
              <span>
                <b className="text-forest-950">{streak}일</b> 연속
                {!studiedToday && <span className="text-forest-950/68"> · 오늘 하면 이어져요</span>}
              </span>
            ) : (
              <span>오늘 공부하면 연속 기록 시작</span>
            )}
          </li>
          {week.hasLastWeek && (
            <li>
              지난주보다{" "}
              <b className={week.diff >= 0 ? "text-forest-700" : "text-forest-950"}>
                {week.diff >= 0 ? "+" : "−"}
                {formatMinutes(Math.abs(week.diff))}
              </b>
            </li>
          )}
        </ul>
      </div>
    </section>
  );

  return (
    <div className="animate-fade-up">
      <Header title={`${greeting()}, ${state.name}님`} subtitle={subtitle} serif />

      {/* 미래에이아이랩 레퍼런스 표시 — 카드가 아니라 한 줄로, 학습 정보보다 앞서지 않게 */}
      <div className="mb-7 flex items-center gap-3 border-b border-cream-300/70 pb-4">
        <BrandLogo priority className="h-8 w-auto shrink-0 md:h-9" />
        <p className="hidden min-w-0 truncate text-sm font-medium text-forest-950/68 sm:block">
          {BRAND.company}이 만든 학습 플랫폼 레퍼런스
        </p>
        <span className="chip ml-auto hidden shrink-0 bg-forest-950 text-xs uppercase tracking-widest text-cream-100 min-[360px]:inline-flex">
          Reference
        </span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr),340px] min-[1400px]:grid-cols-[minmax(0,1fr),380px]">
        <div className="min-w-0 space-y-9">
          {/* 1. 이어서 학습 — 화면의 유일한 Primary */}
          {current && next ? (
            <section
              className="relative overflow-hidden rounded-3xl bg-forest-950 p-6 text-cream-50 shadow-card md:p-8"
              aria-labelledby="continue-heading"
            >
              <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-forest-600/30 blur-3xl" />
              <div className="relative grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr),200px] md:items-center min-[1400px]:grid-cols-[minmax(0,1fr),240px]">
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gold-300">이어서 학습</p>
                    <Link
                      href={`/courses/${current.id}`}
                      className="-my-2 inline-flex min-h-[40px] shrink-0 items-center gap-1 text-sm font-semibold text-cream-200/70 hover:text-cream-50 md:hidden"
                    >
                      강의 정보 <ArrowRight size={14} />
                    </Link>
                  </div>
                  <h2
                    id="continue-heading"
                    className="mt-2 font-display text-xl font-semibold leading-snug md:text-2xl"
                  >
                    {next.title}
                  </h2>
                  <p className="mt-1.5 text-sm text-cream-200/70">
                    {current.title} · {next.durationMin}분
                  </p>
                  <div className="mt-5 max-w-sm">
                    <div className="mb-1.5 flex items-center justify-between text-xs text-cream-200/70">
                      <span>
                        레슨 {doneLessons}/{lessons.length}
                      </span>
                      <span className="font-bold text-cream-50">
                        {store.courseProgress(current.id)}%
                      </span>
                    </div>
                    <ProgressBar
                      label="이어서 학습할 강의 진도"
                      value={store.courseProgress(current.id)}
                      trackClass="bg-forest-800"
                      fillClass="bg-gradient-to-r from-cream-300 to-gold-300"
                    />
                  </div>
                  <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                    <Link
                      href={`/learn/${current.id}?lesson=${next.id}`}
                      className="btn-press inline-flex min-h-[52px] items-center gap-2 rounded-full bg-cream-100 px-7 text-sm font-bold text-forest-950 transition-colors hover:bg-cream-50"
                    >
                      <PlayCircle size={19} />
                      이어서 학습
                    </Link>
                    <Link
                      href={`/courses/${current.id}`}
                      className="hidden items-center gap-1 text-sm font-semibold text-cream-200/75 underline-offset-4 hover:text-cream-50 hover:underline md:inline-flex"
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
                    sizes="240px"
                    className="ring-1 ring-cream-50/10"
                  />
                  <p className="mt-2 text-xs text-cream-200/65">
                    {getInstructor(current.instructorId)?.name} 강사
                  </p>
                </div>
              </div>
            </section>
          ) : (
            <section className="rounded-3xl border border-dashed border-cream-400 p-8 text-center md:p-10">
              <BookOpenCheck size={28} className="mx-auto text-forest-600" aria-hidden />
              <h2 className="mt-3 font-display text-xl font-semibold text-forest-950">
                {enrolled.length > 0 ? "수강 중인 강의를 모두 마쳤어요" : "첫 강의를 골라볼까요?"}
              </h2>
              <p className="mt-2 text-sm text-forest-950/72">
                아래 추천 강의나 강의 찾기에서 다음 배움을 시작해보세요.
              </p>
              <Link
                href="/courses"
                className="btn-press mt-5 inline-flex min-h-[52px] items-center rounded-full bg-forest-900 px-7 text-sm font-bold text-cream-50"
              >
                강의 찾기
              </Link>
            </section>
          )}

          {/* 모바일: 오늘 할 일 → 이번 주를 이어서 학습 바로 아래에 */}
          <div className="space-y-9 lg:hidden">
            {planBlock("m")}
            {weekBlock("m")}
          </div>

          {/* 2. 수강 중인 강의 */}
          {others.length > 0 && (
            <section aria-labelledby="inprogress-heading">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h2 id="inprogress-heading" className="text-lg font-bold text-forest-950">
                  수강 중인 강의
                  <span className="block text-sm font-medium text-forest-950/68 sm:ml-2 sm:inline">
                    {inProgress.length}개 진행 중 · {completedCount}개 완료
                  </span>
                </h2>
                <Link
                  href="/my-learning"
                  className="inline-flex min-h-[40px] shrink-0 items-center gap-1 text-sm font-semibold text-forest-700 hover:text-forest-900"
                >
                  전체 <ArrowRight size={14} />
                </Link>
              </div>
              <ul className="space-y-3">
                {others.map((course) => (
                  <li key={course.id}>
                    <CourseRow course={course} showProgress />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 3. 다음 추천 — 왜 추천하는지 함께 */}
          {recs.length > 0 && (
            <section aria-labelledby="rec-heading">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h2 id="rec-heading" className="text-lg font-bold text-forest-950">
                  다음에 들어볼 강의
                </h2>
                <Link
                  href="/courses"
                  className="inline-flex min-h-[40px] shrink-0 items-center gap-1 text-sm font-semibold text-forest-700 hover:text-forest-900"
                >
                  더 찾아보기 <ArrowRight size={14} />
                </Link>
              </div>
              <ul className="thin-scroll relative -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-3">
                {recs.map(({ course, reason }) => (
                  <li key={course.id} className="w-[78%] shrink-0 snap-start sm:w-auto">
                    <CourseCard course={course} reason={reason} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* 데스크톱 오른쪽: 오늘 할 일 · 이번 주 */}
        <aside className="hidden space-y-9 lg:block">
          {planBlock("d")}
          {weekBlock("d")}
        </aside>
      </div>
    </div>
  );
}

function PlanRow({ item }: { item: PlanItem }) {
  const meta = KIND[item.id];
  const Icon = meta.icon;
  const recent = item.done && isRecent(item.doneAt);
  return (
    <li>
      <Link
        href={item.href}
        className={clsx(
          "group flex min-h-[72px] items-center gap-3.5 px-4 py-3 transition-colors hover:bg-cream-50",
          recent && "bg-forest-50/70"
        )}
      >
        <span
          className={clsx(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            item.done ? "bg-success text-white" : "bg-cream-100 text-forest-700"
          )}
          aria-hidden
        >
          {item.done ? <Check size={17} className="animate-check-pop" /> : <Icon size={17} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold text-forest-950/68">
            {meta.label}
            {item.done && item.doneAt && (
              <span className="text-success">
                {" "}
                · {recent ? "방금 완료" : `${clock(item.doneAt)} 완료`}
              </span>
            )}
          </span>
          <span
            className={clsx(
              "line-clamp-2 block text-sm font-semibold leading-snug",
              item.done ? "text-forest-950/72" : "text-forest-950"
            )}
          >
            {item.title}
          </span>
          <span className="block truncate text-xs text-forest-950/68">{item.detail}</span>
        </span>
        {!item.done && (
          <ArrowRight
            size={16}
            className="shrink-0 text-forest-950/40 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        )}
      </Link>
    </li>
  );
}
