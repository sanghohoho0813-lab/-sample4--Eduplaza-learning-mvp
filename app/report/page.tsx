"use client";

import { useMemo } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  PauseCircle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { QUIZZES, formatMinutes } from "@/lib/data";
import { ACHIEVEMENTS, WEEKLY_GOAL_MIN, dayKey, dueLabel, enrolledCourses, useStore } from "@/lib/store";
import { groupWeak, weeklyGoalMessage } from "@/lib/insights";
import {
  bestDay,
  compareWeeks,
  coursePace,
  milestoneStatus,
  pendingAssignments,
  stalledCourses,
  strengths,
  weeklyActions,
} from "@/lib/coach";
import { Header } from "@/components/Header";
import { ProgressBar } from "@/components/ProgressBar";
import { ActivityList, relativeWhen } from "@/components/ActivityList";
import { ListSkeleton } from "@/components/Skeletons";

const md = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
};

export default function ReportPage() {
  const store = useStore();
  const { state, last7, weeklyTotal, streak } = store;

  const data = useMemo(() => {
    const now = new Date();
    return {
      week: compareWeeks(state.activity, now),
      best: bestDay(last7),
      actions: weeklyActions(state, now, 3),
      good: strengths(state, now),
      pending: pendingAssignments(state, now),
      stalled: stalledCourses(state, now),
      milestones: milestoneStatus(state, now),
    };
  }, [state, last7]);

  if (!store.ready) {
    return (
      <div>
        <Header title="학습 리포트" />
        <ListSkeleton rows={5} />
      </div>
    );
  }

  const { week, best, actions, good, pending, stalled, milestones } = data;
  const weekStart = last7[0].key;
  const inWeek = (iso: string) => dayKey(new Date(iso)) >= weekStart;
  const weekActs = state.activity.filter((a) => inWeek(a.at));
  const lessonsThisWeek = weekActs.filter((a) => a.type === "lesson").length;
  const quizzesThisWeek = weekActs.filter((a) => a.type === "quiz" || a.type === "review").length;
  const notesThisWeek = weekActs.filter((a) => a.type === "note").length;
  const maxDay = Math.max(...last7.map((d) => d.minutes), 1);
  const weak = groupWeak(store.weakQuestions);
  const urgent = pending.filter((p) => p.dLeft <= 3);
  const courses = enrolledCourses(state);
  const active = courses
    .map((c) => coursePace(state, c))
    .filter((p) => p.progress < 100)
    .sort((a, b) => b.progress - a.progress);
  const finished = courses.filter((c) => store.courseProgress(c.id) >= 100);
  const doneMilestones = milestones.filter((m) => m.done).length;

  const headline =
    week.thisWeek === 0
      ? "이번 주는 아직 기록이 없어요"
      : !week.hasLastWeek
        ? `이번 주 ${formatMinutes(week.thisWeek)} 공부했어요`
        : week.diff > 0
          ? `지난주보다 ${formatMinutes(week.diff)} 더 공부했어요`
          : week.diff < 0
            ? `지난주보다 ${formatMinutes(-week.diff)} 덜 공부했어요`
            : "지난주와 같은 만큼 공부했어요";
  const breakdown = [
    lessonsThisWeek > 0 && `레슨 ${lessonsThisWeek}개`,
    quizzesThisWeek > 0 && `퀴즈 ${quizzesThisWeek}회`,
    notesThisWeek > 0 && `메모 ${notesThisWeek}개`,
  ].filter(Boolean);
  const compareMax = Math.max(week.thisWeek, week.lastWeek, 1);

  return (
    <div className="animate-fade-up">
      <Header title="학습 리포트" subtitle="최근 7일 기록으로 보는 이번 주와 다음 할 일" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr),360px] xl:grid-cols-[minmax(0,1fr),400px]">
        {/* 1. 이번 주 — 지난주 대비, 가장 많이 공부한 날, 목표 */}
        <section className="card flex flex-col p-5 md:p-6" aria-labelledby="summary-heading">
          <p className="text-xs font-semibold text-forest-950/68">
            이번 주 · {md(last7[0].key)} – {md(last7[6].key)}
          </p>
          <h2 id="summary-heading" className="mt-1 font-display text-xl font-semibold leading-snug text-forest-950 md:text-2xl">
            {headline}
          </h2>
          <p className="mt-1 text-sm text-forest-950/72">
            {breakdown.length > 0
              ? `${breakdown.join(" · ")}${streak > 0 ? ` · ${streak}일 연속` : ""}`
              : "짧은 레슨 하나로 이번 주 기록을 시작해 보세요."}
          </p>

          <div className="mt-5 grid flex-1 grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr),250px]">
            {/* 7일 막대 — 가장 많이 공부한 날은 금색으로 */}
            <div className="flex flex-col">
              <div className="flex h-40 items-end justify-between gap-2 md:h-auto md:min-h-[10rem] md:flex-1 md:gap-3">
                {last7.map((d) => {
                  const isBest = best?.key === d.key;
                  return (
                    <div key={d.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                      <span
                        className={clsx(
                          "text-xs font-semibold",
                          isBest ? "text-amber-600" : d.isToday ? "text-forest-800" : "text-forest-950/68"
                        )}
                      >
                        {d.minutes > 0 ? d.minutes : ""}
                      </span>
                      <div
                        className={clsx(
                          "w-full max-w-[36px] rounded-t-lg transition-all duration-500",
                          isBest ? "bg-gold-400" : d.isToday ? "bg-forest-700" : "bg-forest-200"
                        )}
                        style={{ height: `${Math.max((d.minutes / maxDay) * 75, d.minutes > 0 ? 8 : 3)}%` }}
                        role="img"
                        aria-label={`${d.isToday ? "오늘" : `${d.label}요일`} ${d.minutes}분${isBest ? " (가장 많이 공부한 날)" : ""}`}
                      />
                      <span
                        className={clsx(
                          "text-xs",
                          d.isToday ? "font-bold text-forest-800" : "text-forest-950/68"
                        )}
                      >
                        {d.isToday ? "오늘" : d.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <dl className="space-y-4 md:border-l md:border-cream-200 md:pl-6">
              <div>
                <dt className="text-xs text-forest-950/68">지난주와 비교</dt>
                <dd className="mt-1.5 space-y-1.5">
                  <CompareBar label="이번 주" minutes={week.thisWeek} max={compareMax} strong />
                  {week.hasLastWeek ? (
                    <CompareBar label="지난주" minutes={week.lastWeek} max={compareMax} />
                  ) : (
                    <p className="text-xs text-forest-950/68">지난주 기록이 없어 비교하지 않아요</p>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-forest-950/68">가장 많이 공부한 날</dt>
                <dd className="mt-0.5 text-base font-semibold text-forest-950">
                  {best ? (
                    <>
                      {best.isToday ? "오늘" : `${best.label}요일`}{" "}
                      <span className="text-forest-950/68">· {formatMinutes(best.minutes)}</span>
                    </>
                  ) : (
                    <span className="text-forest-950/68">아직 없어요</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-5 rounded-xl bg-cream-100 p-4">
            <div className="mb-1.5 flex flex-col gap-0.5 text-sm sm:flex-row sm:justify-between sm:gap-3">
              <span className="text-forest-950/72">{weeklyGoalMessage(weeklyTotal, WEEKLY_GOAL_MIN)}</span>
              <span className="shrink-0 font-bold text-forest-800">
                {formatMinutes(weeklyTotal)} / {formatMinutes(WEEKLY_GOAL_MIN)}
              </span>
            </div>
            <ProgressBar
              label="이번 주 목표 달성률"
              value={(weeklyTotal / WEEKLY_GOAL_MIN) * 100}
              fillClass={weeklyTotal >= WEEKLY_GOAL_MIN ? "bg-success" : "bg-forest-600"}
              trackClass="bg-cream-300/60"
            />
          </div>
        </section>

        {/* 2. 그래서 이번 주에 할 일 */}
        <section className="card flex flex-col p-5 md:p-6" aria-labelledby="actions-heading">
          <h2 id="actions-heading" className="text-base font-bold text-forest-950">
            이번 주 추천 행동
          </h2>
          <p className="mt-0.5 text-sm text-forest-950/68">기록을 보고 효과가 큰 순서로 골랐어요</p>
          {actions.length === 0 ? (
            <div className="mt-4 flex flex-1 flex-col items-start justify-center rounded-xl bg-success/10 p-4">
              <CheckCircle2 size={22} className="text-success" />
              <p className="mt-2 text-base font-semibold text-forest-950">급하게 할 일은 없어요</p>
              <p className="mt-0.5 text-sm text-forest-950/72">
                마감 임박 과제도, 틀린 문제도 없어요. 다음 강의를 골라 보세요.
              </p>
              <Link href="/courses" className="btn-press mt-3 inline-flex min-h-[44px] items-center gap-1 text-sm font-bold text-forest-700">
                강의 둘러보기 <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <ol className="mt-4 space-y-3">
              {actions.map((a, i) => (
                <li key={a.id} className={clsx("rounded-xl border p-4", a.urgent ? "border-amber-300 bg-amber-50" : "border-cream-200")}>
                  <div className="flex gap-3">
                    <span
                      className={clsx(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                        a.urgent ? "bg-amber-400 text-forest-950" : "bg-forest-900 text-cream-50"
                      )}
                      aria-hidden
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold leading-snug text-forest-950">{a.title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-forest-950/72">{a.reason}</p>
                      <Link
                        href={a.href}
                        className="btn-press mt-2 inline-flex min-h-[40px] items-center gap-1 rounded-full bg-forest-900 px-4 text-sm font-bold text-cream-50 hover:bg-forest-800"
                      >
                        {a.cta}
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {/* 3. 진단 — 보완할 점 / 잘하고 있는 점 */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="card p-5 md:p-6" aria-labelledby="improve-heading">
          <h2 id="improve-heading" className="text-base font-bold text-forest-950">
            보완할 점
          </h2>
          {weak.length === 0 && urgent.length === 0 && stalled.length === 0 ? (
            <p className="mt-2 text-sm text-forest-950/68">
              틀린 문제도, 마감이 급한 과제도, 멈춘 강의도 없어요.
            </p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {weak.length > 0 && (
                <li>
                  <Link
                    href={`/quiz/${weak[0].quiz.id}?mode=review`}
                    className="group flex items-center gap-3 rounded-xl border border-cream-200 p-3.5 transition-colors hover:border-forest-300"
                  >
                    <RotateCcw size={18} className="shrink-0 text-clay-500" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold text-forest-950/68">가장 취약한 영역</span>
                      <span className="block text-base font-semibold leading-snug text-forest-950">
                        {weak[0].topics.join(", ")}
                      </span>
                      <span className="block text-sm text-forest-950/68">
                        {weak[0].quiz.title} · 틀린 문제 {weak[0].count}개
                        {weak.length > 1 && ` 외 ${weak.slice(1).reduce((s, g) => s + g.count, 0)}개`}
                      </span>
                    </span>
                    <ChevronRight size={16} className="shrink-0 text-forest-950/68" />
                  </Link>
                </li>
              )}
              {urgent.map((u) => (
                <li key={u.assignment.id}>
                  <Link
                    href={`/quiz?tab=assignment#${u.assignment.id}`}
                    className="group flex items-center gap-3 rounded-xl border border-cream-200 p-3.5 transition-colors hover:border-forest-300"
                  >
                    <AlertCircle size={18} className="shrink-0 text-amber-500" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold text-forest-950/68">
                        {u.dLeft < 0 ? "밀린 과제" : "마감이 다가온 과제"}
                      </span>
                      <span className="block text-base font-semibold leading-snug text-forest-950">
                        {u.assignment.title}
                      </span>
                      <span className={clsx("block text-sm", u.dLeft <= 1 ? "font-semibold text-amber-600" : "text-forest-950/68")}>
                        {dueLabel(u.dLeft)}
                      </span>
                    </span>
                    <ChevronRight size={16} className="shrink-0 text-forest-950/68" />
                  </Link>
                </li>
              ))}
              {stalled.map((s) => (
                <li key={s.course.id}>
                  <Link
                    href={s.next ? `/learn/${s.course.id}?lesson=${s.next.id}` : `/courses/${s.course.id}`}
                    className="group flex items-center gap-3 rounded-xl border border-cream-200 p-3.5 transition-colors hover:border-forest-300"
                  >
                    <PauseCircle size={18} className="shrink-0 text-forest-500" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold text-forest-950/68">멈춘 강의 · {s.idleDays}일째</span>
                      <span className="block text-base font-semibold leading-snug text-forest-950">{s.course.title}</span>
                      <span className="block text-sm text-forest-950/68">진도 {s.progress}%</span>
                    </span>
                    <ChevronRight size={16} className="shrink-0 text-forest-950/68" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5 md:p-6" aria-labelledby="good-heading">
          <h2 id="good-heading" className="text-base font-bold text-forest-950">
            잘하고 있는 점
          </h2>
          {good.length === 0 ? (
            <p className="mt-2 text-sm text-forest-950/68">
              기록이 조금 더 쌓이면 잘하고 있는 점을 찾아 드려요.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {good.map((g) => (
                <li key={g.id} className="flex gap-3">
                  <Sparkles size={18} className="mt-0.5 shrink-0 text-gold-500" aria-hidden />
                  <span>
                    <span className="block text-base font-semibold leading-snug text-forest-950">{g.title}</span>
                    <span className="block text-sm text-forest-950/68">{g.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* 4. 강의별 진도와 완주 예상 */}
      <section className="card mt-6 p-5 md:p-6" aria-labelledby="course-heading">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-3">
          <h2 id="course-heading" className="text-base font-bold text-forest-950">
            강의별 진도
          </h2>
          <span className="text-sm text-forest-950/68">최근 2주 속도로 완주 시점을 예상해요</span>
        </div>
        {active.length === 0 ? (
          <p className="text-sm text-forest-950/68">
            진행 중인 강의가 없어요.{" "}
            <Link href="/courses" className="font-semibold text-forest-600">
              다음 강의를 골라 보세요.
            </Link>
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
            {active.map((p) => (
              <li key={p.course.id}>
                <Link href={`/courses/${p.course.id}`} className="group block">
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-semibold text-forest-950/85 transition-colors group-hover:text-forest-600">
                      {p.course.title}
                    </span>
                    <span className="shrink-0 text-sm font-bold text-forest-700">{p.progress}%</span>
                  </div>
                  <ProgressBar label={`${p.course.title} 진도`} value={p.progress} animate={false} />
                  <p className="mt-1.5 text-xs leading-relaxed text-forest-950/68">
                    <Clock size={12} aria-hidden className="mr-1 inline -translate-y-px" />
                    레슨 {p.remainingLessons}개 · {formatMinutes(p.remainingMinutes)} 남음
                    {" · "}
                    {p.etaDays !== null ? (
                      <b className="whitespace-nowrap font-semibold text-forest-800">약 {p.etaDays}일 뒤 완주</b>
                    ) : (
                      "최근 2주 기록이 없어 예상하지 않아요"
                    )}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {finished.length > 0 && (
          <p className="mt-5 border-t border-cream-200 pt-4 text-sm text-forest-950/72">
            <CheckCircle2 size={15} className="mr-1.5 inline -translate-y-px text-success" aria-hidden />
            완주한 강의 {finished.length}개 ·{" "}
            {finished.map((c, i) => (
              <span key={c.id}>
                {i > 0 && ", "}
                <Link href={`/courses/${c.id}`} className="font-semibold text-forest-800 hover:underline">
                  {c.title}
                </Link>
              </span>
            ))}
          </p>
        )}
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr),360px] xl:grid-cols-[minmax(0,1fr),400px]">
        {/* 5. 학습 기록 */}
        <div className="min-w-0 space-y-6">
          <section className="card p-5 md:p-6" aria-labelledby="quiz-heading">
            <h2 id="quiz-heading" className="text-base font-bold text-forest-950">
              퀴즈 기록
            </h2>
            {state.quizResults.length === 0 ? (
              <p className="mt-2 text-sm text-forest-950/68">
                아직 퀴즈 기록이 없어요.{" "}
                <Link href="/quiz" className="font-semibold text-forest-600">
                  첫 퀴즈에 도전해보세요.
                </Link>
              </p>
            ) : (
              <ul className="mt-1 divide-y divide-cream-100">
                {state.quizResults.slice(0, 5).map((r) => {
                  const quiz = QUIZZES.find((q) => q.id === r.quizId);
                  return (
                    <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-forest-950/85">{quiz?.title ?? "퀴즈"}</p>
                        <p className="text-xs text-forest-950/68">
                          {relativeWhen(r.date)} · {r.mode === "review" ? "오답 복습" : "전체 풀이"} {r.correct}/{r.total}
                        </p>
                      </div>
                      <span
                        className={clsx(
                          "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                          r.score === 100 ? "bg-gold-300/25 text-gold-600" : "bg-forest-50 text-forest-700"
                        )}
                      >
                        {r.score}점
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="card p-5 md:p-6" aria-labelledby="log-heading">
            <h2 id="log-heading" className="mb-1 text-base font-bold text-forest-950">
              최근 학습 기록
            </h2>
            <ActivityList items={state.activity.slice(0, 8)} />
          </section>
        </div>

        {/* 6. 이정표 — 배지 대신 조용한 체크리스트 */}
        <section className="card self-start p-5 md:p-6" aria-labelledby="ach-heading">
          <div className="flex items-baseline justify-between">
            <h2 id="ach-heading" className="text-base font-bold text-forest-950">
              학습 이정표
            </h2>
            <span className="text-sm text-forest-950/68">
              {doneMilestones}/{milestones.length} 달성
            </span>
          </div>
          <ul className="mt-3 divide-y divide-cream-100">
            {milestones.map((m) => {
              const def = ACHIEVEMENTS.find((a) => a.id === m.id);
              if (!def) return null;
              return (
                <li key={m.id} className="flex items-start gap-3 py-3 first:pt-1 last:pb-0">
                  {m.done ? (
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success" aria-hidden />
                  ) : (
                    <Circle size={18} className="mt-0.5 shrink-0 text-cream-400" aria-hidden />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className={clsx("block text-sm font-semibold", m.done ? "text-forest-950" : "text-forest-950/80")}>
                      {def.description}
                      <span className="sr-only">{m.done ? " (달성)" : " (아직)"}</span>
                    </span>
                    <span className="block text-xs text-forest-950/68">
                      {m.done ? (m.at ? `${md(m.at)} 달성` : "달성") : m.progress}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}

function CompareBar({
  label,
  minutes,
  max,
  strong = false,
}: {
  label: string;
  minutes: number;
  max: number;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-12 shrink-0 whitespace-nowrap text-forest-950/68">{label}</span>
      <span className="h-2 flex-1 overflow-hidden rounded-full bg-cream-200">
        <span
          className={clsx("block h-full rounded-full", strong ? "bg-forest-700" : "bg-forest-300")}
          style={{ width: `${Math.max(3, (minutes / max) * 100)}%` }}
        />
      </span>
      <span className={clsx("shrink-0 whitespace-nowrap text-right", strong ? "font-bold text-forest-950" : "text-forest-950/72")}>
        {formatMinutes(minutes)}
      </span>
    </div>
  );
}
