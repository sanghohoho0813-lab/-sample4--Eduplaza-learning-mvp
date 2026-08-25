"use client";

import Link from "next/link";
import clsx from "clsx";
import {
  Award,
  BarChart3,
  Flame,
  GraduationCap,
  PenSquare,
  Timer,
  TrendingUp,
} from "lucide-react";
import { COURSES, QUIZZES, formatMinutes } from "@/lib/data";
import { ACHIEVEMENTS, useStore } from "@/lib/store";
import { Header } from "@/components/Header";
import { ProgressBar, ProgressRing } from "@/components/ProgressBar";
import { ListSkeleton } from "@/components/Skeletons";

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];
const WEEKLY_GOAL_MIN = 300; // 주 5시간

export default function ReportPage() {
  const store = useStore();

  if (!store.ready) {
    return (
      <div>
        <Header title="성적 · 리포트" />
        <ListSkeleton rows={5} />
      </div>
    );
  }

  const { state } = store;
  const weeklyTotal = state.weeklyMinutes.reduce((a, b) => a + b, 0);
  const maxDay = Math.max(...state.weeklyMinutes, 1);
  const todayIdx = (new Date().getDay() + 6) % 7;

  const quizAvg =
    state.quizResults.length > 0
      ? Math.round(
          state.quizResults.reduce((a, r) => a + r.score, 0) /
            state.quizResults.length
        )
      : 0;

  const enrolled = state.enrollments
    .map((e) => COURSES.find((c) => c.id === e.courseId))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <div className="animate-fade-up">
      <Header
        title="성적 · 리포트"
        subtitle="꾸준함이 쌓여 실력이 됩니다. 이번 주도 잘하고 있어요."
      />

      {/* 요약 지표 */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {[
          {
            icon: Timer,
            iconClass: "bg-cream-100 text-forest-600",
            label: "이번 주 학습시간",
            value: formatMinutes(weeklyTotal),
          },
          {
            icon: PenSquare,
            iconClass: "bg-forest-100 text-forest-700",
            label: "퀴즈 평균 점수",
            value: `${quizAvg}점`,
          },
          {
            icon: Flame,
            iconClass: "bg-gold-300/25 text-gold-600",
            label: "연속 학습",
            value: `${state.streakDays}일`,
          },
          {
            icon: GraduationCap,
            iconClass: "bg-forest-100 text-success",
            label: "완료 레슨",
            value: `${store.completedLessonCount()}개`,
          },
        ].map(({ icon: Icon, iconClass, label, value }) => (
          <div key={label} className="card p-4 md:p-5">
            <span
              className={clsx(
                "mb-2 flex h-9 w-9 items-center justify-center rounded-full",
                iconClass
              )}
            >
              <Icon size={17} />
            </span>
            <p className="text-xs text-forest-950/50">{label}</p>
            <p className="mt-0.5 font-display text-lg font-semibold text-forest-950">
              {value}
            </p>
          </div>
        ))}
      </section>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr,340px]">
        <div className="space-y-5">
          {/* 주간 학습 차트 */}
          <section className="card p-5 md:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-[15px] font-bold text-forest-950">
                <BarChart3 size={17} className="text-forest-600" />
                주간 학습 시간
              </h2>
              <span className="text-xs text-forest-950/45">
                주간 목표 {formatMinutes(WEEKLY_GOAL_MIN)}
              </span>
            </div>
            <div className="flex h-40 items-end justify-between gap-2 md:gap-3">
              {state.weeklyMinutes.map((min, i) => (
                <div
                  key={i}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                >
                  <span className="text-[11px] font-semibold text-forest-950/55">
                    {min > 0 ? formatMinutes(min) : ""}
                  </span>
                  <div
                    className={clsx(
                      "w-full max-w-[38px] rounded-t-lg transition-all duration-500",
                      i === todayIdx
                        ? "bg-gradient-to-t from-forest-800 to-forest-500"
                        : "bg-forest-200"
                    )}
                    style={{
                      height: `${Math.max((min / maxDay) * 62, min > 0 ? 8 : 3)}%`,
                    }}
                  />
                  <span
                    className={clsx(
                      "text-xs",
                      i === todayIdx
                        ? "font-bold text-forest-800"
                        : "text-forest-950/45"
                    )}
                  >
                    {DAY_LABELS[i]}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-xl bg-cream-100 p-3.5">
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-forest-950/55">주간 목표 달성률</span>
                <span className="font-bold text-forest-800">
                  {Math.min(100, Math.round((weeklyTotal / WEEKLY_GOAL_MIN) * 100))}%
                </span>
              </div>
              <ProgressBar
                value={(weeklyTotal / WEEKLY_GOAL_MIN) * 100}
                fillClass="bg-success"
                trackClass="bg-cream-300/60"
              />
            </div>
          </section>

          {/* 강의별 성과 */}
          <section className="card p-5 md:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-[15px] font-bold text-forest-950">
              <TrendingUp size={17} className="text-forest-600" />
              강의별 진도
            </h2>
            <ul className="space-y-4">
              {enrolled.map((course) => {
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
                      <ProgressBar
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

          {/* 퀴즈 기록 */}
          <section className="card p-5 md:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-[15px] font-bold text-forest-950">
              <PenSquare size={17} className="text-forest-600" />
              퀴즈 기록
            </h2>
            {state.quizResults.length === 0 ? (
              <p className="text-sm text-forest-950/50">
                아직 퀴즈 기록이 없어요.{" "}
                <Link href="/quiz" className="font-semibold text-forest-600">
                  첫 퀴즈에 도전해보세요.
                </Link>
              </p>
            ) : (
              <ul className="divide-y divide-cream-100">
                {state.quizResults.slice(0, 6).map((r) => {
                  const quiz = QUIZZES.find((q) => q.id === r.quizId);
                  return (
                    <li
                      key={r.id}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-forest-950/85">
                          {quiz?.title ?? "퀴즈"}
                        </p>
                        <p className="text-xs text-forest-950/45">
                          {new Date(r.date).toLocaleDateString("ko-KR")} · 정답{" "}
                          {r.correct}/{r.total}
                        </p>
                      </div>
                      <span
                        className={clsx(
                          "chip",
                          r.score === 100
                            ? "bg-gold-300/25 text-gold-600"
                            : r.score >= 70
                              ? "bg-forest-100 text-forest-700"
                              : "bg-cream-100 text-forest-950/55"
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
        </div>

        <aside className="space-y-5">
          {/* 전체 진행률 */}
          <section className="card flex flex-col items-center p-6 text-center">
            <h3 className="mb-4 text-sm font-bold text-forest-950">
              전체 학습 진행률
            </h3>
            <ProgressRing value={store.overallProgress()} size={130} stroke={11}>
              <div>
                <p className="font-display text-3xl font-semibold text-forest-900">
                  {store.overallProgress()}%
                </p>
              </div>
            </ProgressRing>
            <p className="mt-4 text-sm text-forest-950/55">
              수강 중인 {enrolled.length}개 강의 기준이에요.
              <br />
              조금만 더 하면 다음 강의를 완료할 수 있어요!
            </p>
          </section>

          {/* 성취 배지 */}
          <section className="card p-5">
            <h3 className="mb-4 flex items-center gap-1.5 text-sm font-bold text-forest-950">
              <Award size={15} className="text-gold-500" />
              나의 성취
            </h3>
            <ul className="grid grid-cols-2 gap-2.5">
              {ACHIEVEMENTS.map((a) => {
                const unlocked = state.unlockedAchievements.includes(a.id);
                return (
                  <li
                    key={a.id}
                    className={clsx(
                      "rounded-xl border p-3 text-center transition-all",
                      unlocked
                        ? "border-gold-300/60 bg-gold-300/10"
                        : "border-cream-200 bg-cream-50 opacity-50"
                    )}
                  >
                    <span className="text-xl">{a.emoji}</span>
                    <p className="mt-1 text-xs font-bold text-forest-950">
                      {a.label}
                    </p>
                    <p className="mt-0.5 text-[11px] text-forest-950/50">
                      {a.description}
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
