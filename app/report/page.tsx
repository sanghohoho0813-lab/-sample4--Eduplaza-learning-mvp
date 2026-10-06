"use client";

import Link from "next/link";
import clsx from "clsx";
import { ChevronRight, RotateCcw } from "lucide-react";
import { ASSIGNMENTS, QUIZZES, formatMinutes } from "@/lib/data";
import { ACHIEVEMENTS, WEEKLY_GOAL_MIN, dayKey, dueLabel, enrolledCourses, useStore } from "@/lib/store";
import { groupWeak, weeklyGoalMessage } from "@/lib/insights";
import { Header } from "@/components/Header";
import { ProgressBar } from "@/components/ProgressBar";
import { ActivityList, relativeWhen } from "@/components/ActivityList";
import { ListSkeleton } from "@/components/Skeletons";

export default function ReportPage() {
  const store = useStore();

  if (!store.ready) {
    return (
      <div>
        <Header title="학습 리포트" />
        <ListSkeleton rows={5} />
      </div>
    );
  }

  const { state, last7, weeklyTotal, streak } = store;
  const weekStart = last7[0].key;
  const inWeek = (iso: string) => dayKey(new Date(iso)) >= weekStart;
  const lessonsThisWeek = state.activity.filter((a) => a.type === "lesson" && inWeek(a.at)).length;
  const fullAttempts = state.quizResults.filter((r) => r.mode === "full");
  const quizAvg = fullAttempts.length
    ? Math.round(fullAttempts.reduce((a, r) => a + r.score, 0) / fullAttempts.length)
    : 0;
  const maxDay = Math.max(...last7.map((d) => d.minutes), 1);
  const weak = groupWeak(store.weakQuestions);
  const courses = enrolledCourses(state);
  const submitted = ASSIGNMENTS.filter((a) => store.assignmentStatus(a.id) === "submitted").length;
  const weeklyLeft = Math.max(0, WEEKLY_GOAL_MIN - weeklyTotal);

  const summary =
    lessonsThisWeek > 0
      ? `최근 7일 동안 레슨 ${lessonsThisWeek}개를 마치고 ${formatMinutes(weeklyTotal)} 공부했어요.`
      : "최근 7일 동안 기록이 없어요. 짧은 레슨 하나로 다시 시작해볼까요?";

  return (
    <div className="animate-fade-up">
      <Header title="학습 리포트" />

      {/* 이번 주 요약 — 숫자는 한 카드 안에서만 */}
      <section className="card p-5 md:p-6" aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="text-base font-bold text-forest-950">
          이번 주 요약
        </h2>
        <p className="mt-1 text-sm text-forest-950/72">{summary}</p>
        <dl className="mt-5 grid grid-cols-2 gap-y-5 md:grid-cols-4 md:divide-x md:divide-cream-200">
          {[
            ["학습 시간", formatMinutes(weeklyTotal)],
            ["완료 레슨", `${lessonsThisWeek}개`],
            ["퀴즈 평균", fullAttempts.length ? `${quizAvg}점` : "-"],
            ["연속 학습", `${streak}일`],
          ].map(([label, value]) => (
            <div key={label} className="md:px-5 md:first:pl-0">
              <dt className="text-xs text-forest-950/68">{label}</dt>
              <dd className="mt-0.5 font-display text-xl font-semibold text-forest-950">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 rounded-xl bg-cream-100 p-4">
          <div className="mb-1.5 flex justify-between text-sm">
            <span className="text-forest-950/72">{weeklyGoalMessage(weeklyTotal, WEEKLY_GOAL_MIN)}</span>
            <span className="font-bold text-forest-800">
              {Math.min(100, Math.round((weeklyTotal / WEEKLY_GOAL_MIN) * 100))}%
            </span>
          </div>
          <ProgressBar label="이번 주 목표 달성률"
            value={(weeklyTotal / WEEKLY_GOAL_MIN) * 100}
            fillClass={weeklyLeft === 0 ? "bg-success" : "bg-forest-600"}
            trackClass="bg-cream-300/60"
          />
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr),360px]">
        <div className="min-w-0 space-y-6">
          {/* 최근 7일 */}
          <section className="card p-5 md:p-6" aria-labelledby="chart-heading">
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h2 id="chart-heading" className="text-base font-bold text-forest-950">
                최근 7일 학습 시간
              </h2>
              <span className="shrink-0 text-xs text-forest-950/68">단위: 분</span>
            </div>
            <div className="flex h-48 items-end justify-between gap-2 md:gap-3">
              {last7.map((d) => (
                <div
                  key={d.key}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                >
                  <span
                    className={clsx(
                      "text-xs font-semibold",
                      d.isToday ? "text-forest-800" : "text-forest-950/68"
                    )}
                  >
                    {d.minutes > 0 ? d.minutes : ""}
                  </span>
                  <div
                    className={clsx(
                      "w-full max-w-[38px] rounded-t-lg transition-all duration-500",
                      d.isToday ? "bg-forest-700" : "bg-forest-200"
                    )}
                    style={{ height: `${Math.max((d.minutes / maxDay) * 70, d.minutes > 0 ? 8 : 3)}%` }}
                    role="img"
                    aria-label={`${d.label}요일 ${d.minutes}분`}
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
              ))}
            </div>
          </section>

          {/* 강의별 진도 */}
          <section className="card p-5 md:p-6" aria-labelledby="course-heading">
            <div className="mb-4 flex items-center justify-between">
              <h2 id="course-heading" className="text-base font-bold text-forest-950">
                강의별 진도
              </h2>
              <span className="text-sm text-forest-950/68">평균 {store.overallProgress()}%</span>
            </div>
            <ul className="space-y-4">
              {courses.map((course) => {
                const pct = store.courseProgress(course.id);
                return (
                  <li key={course.id}>
                    <Link href={`/courses/${course.id}`} className="group block">
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-semibold text-forest-950/85 transition-colors group-hover:text-forest-600">
                          {course.title}
                        </span>
                        <span
                          className={clsx(
                            "shrink-0 text-sm font-bold",
                            pct >= 100 ? "text-success" : "text-forest-700"
                          )}
                        >
                          {pct}%
                        </span>
                      </div>
                      <ProgressBar label={`${course.title} 진도`}
                        value={pct}
                        fillClass={pct >= 100 ? "bg-success" : "bg-forest-600"}
                        animate={false}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* 최근 학습 기록 */}
          <section className="card p-5 md:p-6" aria-labelledby="log-heading">
            <h2 id="log-heading" className="mb-1 text-base font-bold text-forest-950">
              최근 학습 기록
            </h2>
            <ActivityList items={state.activity.slice(0, 8)} />
          </section>
        </div>

        <aside className="space-y-6">
          {/* 취약 영역 — 틀린 문항에서 계산 */}
          <section className="card p-5" aria-labelledby="weak-heading">
            <h2 id="weak-heading" className="text-base font-bold text-forest-950">
              취약 영역
            </h2>
            {weak.length === 0 ? (
              <p className="mt-2 text-sm text-forest-950/68">
                지금은 다시 풀 문제가 없어요. 잘하고 있어요!
              </p>
            ) : (
              <>
                <p className="mt-1 text-sm text-forest-950/68">
                  틀린 문제에서 찾은 보완 주제예요.
                </p>
                <ul className="mt-3 space-y-2">
                  {weak.map((g) => (
                    <li key={g.quiz.id}>
                      <Link
                        href={`/quiz/${g.quiz.id}?mode=review`}
                        className="group flex min-h-[56px] items-center gap-3 rounded-xl border border-cream-200 px-3.5 py-2.5 transition-colors hover:border-forest-300"
                      >
                        <RotateCcw size={16} className="shrink-0 text-forest-600" />
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2 block text-sm font-semibold leading-snug text-forest-950">
                            {g.topics.join(", ")}
                          </span>
                          <span className="block truncate text-xs text-forest-950/68">
                            {g.quiz.title} · {g.count}문제
                          </span>
                        </span>
                        <ChevronRight size={16} className="shrink-0 text-forest-950/68" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          {/* 퀴즈 기록 */}
          <section className="card p-5" aria-labelledby="quiz-heading">
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
                        <p className="truncate text-sm font-semibold text-forest-950/85">
                          {quiz?.title ?? "퀴즈"}
                        </p>
                        <p className="text-xs text-forest-950/68">
                          {relativeWhen(r.date)} · {r.mode === "review" ? "오답 복습" : "전체 풀이"}{" "}
                          {r.correct}/{r.total}
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

          {/* 과제 현황 */}
          <section className="card p-5" aria-labelledby="assignment-heading">
            <div className="flex items-center justify-between">
              <h2 id="assignment-heading" className="text-base font-bold text-forest-950">
                과제
              </h2>
              <span className="text-sm text-forest-950/68">
                제출 {submitted}/{ASSIGNMENTS.length}
              </span>
            </div>
            <ProgressBar label="과제 제출률"
              value={(submitted / ASSIGNMENTS.length) * 100}
              fillClass="bg-forest-600"
              height="h-1.5"
              className="mt-3"
            />
            {store.upcomingAssignments.length > 0 ? (
              <ul className="mt-3 space-y-1">
                {store.upcomingAssignments.slice(0, 3).map((u) => (
                  <li key={u.assignment.id}>
                    <Link
                      href={`/quiz?tab=assignment#${u.assignment.id}`}
                      className="flex min-h-[44px] items-center justify-between gap-3 rounded-lg px-1 text-sm hover:bg-cream-50"
                    >
                      <span className="truncate text-forest-950/80">{u.assignment.title}</span>
                      <span
                        className={clsx(
                          "shrink-0 text-xs font-semibold",
                          u.dLeft <= 1 ? "text-amber-600" : "text-forest-950/68"
                        )}
                      >
                        {dueLabel(u.dLeft)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-forest-950/68">남은 과제가 없어요.</p>
            )}
          </section>

          {/* 성취 */}
          <section className="card p-5" aria-labelledby="ach-heading">
            <h2 id="ach-heading" className="mb-3 text-base font-bold text-forest-950">
              나의 성취{" "}
              <span className="text-sm font-medium text-forest-950/68">
                {state.unlockedAchievements.length}/{ACHIEVEMENTS.length}
              </span>
            </h2>
            <ul className="grid grid-cols-2 gap-2.5">
              {ACHIEVEMENTS.map((a) => {
                const unlocked = state.unlockedAchievements.includes(a.id);
                const Icon = a.icon;
                return (
                  <li
                    key={a.id}
                    className={clsx(
                      "flex flex-col items-center rounded-xl border p-3 text-center",
                      unlocked ? "border-gold-300/60 bg-gold-300/10" : "border-dashed border-cream-300 bg-white"
                    )}
                  >
                    <span
                      className={clsx(
                        "flex h-10 w-10 items-center justify-center rounded-full",
                        unlocked ? "bg-gold-300/30 text-gold-600" : "bg-cream-200 text-forest-950/68"
                      )}
                      aria-hidden
                    >
                      <Icon size={19} />
                    </span>
                    <p className={clsx("mt-1.5 text-xs font-bold", unlocked ? "text-forest-950" : "text-forest-950/68")}>
                      {a.label}
                    </p>
                    <p className="mt-0.5 text-xs text-forest-950/68">
                      {a.description}
                      <span className="sr-only">{unlocked ? " (달성)" : " (아직 잠김)"}</span>
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
