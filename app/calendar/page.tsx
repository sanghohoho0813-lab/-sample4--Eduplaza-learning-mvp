"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  BookOpen,
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  PenSquare,
} from "lucide-react";
import { ASSIGNMENTS, QUIZZES, getCourse } from "@/lib/data";
import { useStore } from "@/lib/store";
import { Header } from "@/components/Header";
import { ListSkeleton } from "@/components/Skeletons";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default function CalendarPage() {
  const store = useStore();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  // 날짜별 이벤트 맵
  const events = useMemo(() => {
    const map = new Map<
      string,
      { study?: boolean; quiz?: boolean; assignment?: boolean }
    >();
    const put = (key: string, patch: Record<string, boolean>) => {
      map.set(key, { ...map.get(key), ...patch });
    };
    if (store.ready) {
      // 연속 학습일: 오늘 포함 streakDays일
      for (let i = 0; i < store.state.streakDays; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        put(dateKey(d), { study: true });
      }
      store.state.quizResults.forEach((r) => {
        put(dateKey(new Date(r.date)), { quiz: true });
      });
      ASSIGNMENTS.forEach((a) => {
        put(a.dueDate, { assignment: true });
      });
    }
    return map;
  }, [store.ready, store.state.streakDays, store.state.quizResults]);

  if (!store.ready) {
    return (
      <div>
        <Header title="학습 캘린더" />
        <ListSkeleton rows={4} />
      </div>
    );
  }

  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const todayKey = dateKey(today);

  const move = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const upcomingAssignments = ASSIGNMENTS.filter(
    (a) => store.assignmentStatus(a.id) !== "submitted"
  )
    .filter((a) => new Date(a.dueDate + "T23:59:59").getTime() >= Date.now())
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const doneMissions = store.state.missions.filter((m) => m.done).length;

  return (
    <div className="animate-fade-up">
      <Header
        title="학습 캘린더"
        subtitle="꾸준히 쌓아온 학습 기록을 한눈에 확인하세요."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr,340px]">
        {/* 캘린더 */}
        <section className="card p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-forest-950">
              {year}년 {month + 1}월
            </h2>
            <div className="flex gap-1.5">
              <button
                onClick={() => move(-1)}
                className="btn-press flex h-10 w-10 items-center justify-center rounded-full border border-cream-300 text-forest-800"
                aria-label="이전 달"
              >
                <ChevronLeft size={17} />
              </button>
              <button
                onClick={() => move(1)}
                className="btn-press flex h-10 w-10 items-center justify-center rounded-full border border-cream-300 text-forest-800"
                aria-label="다음 달"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((w, i) => (
              <div
                key={w}
                className={clsx(
                  "pb-2 text-xs font-bold",
                  i === 0
                    ? "text-danger/70"
                    : i === 6
                      ? "text-info"
                      : "text-forest-950/45"
                )}
              >
                {w}
              </div>
            ))}
            {cells.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} />;
              const key = dateKey(new Date(year, month, day));
              const ev = events.get(key);
              const isToday = key === todayKey;
              return (
                <div
                  key={key}
                  className={clsx(
                    "relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition-colors md:aspect-auto md:min-h-[64px]",
                    isToday
                      ? "bg-forest-950 font-bold text-cream-50 shadow-glow"
                      : ev?.study
                        ? "bg-forest-50 text-forest-950"
                        : "text-forest-950/70"
                  )}
                >
                  {day}
                  <div className="mt-1 flex h-1.5 items-center gap-0.5">
                    {ev?.study && (
                      <span
                        className={clsx(
                          "h-1.5 w-1.5 rounded-full",
                          isToday ? "bg-gold-300" : "bg-success"
                        )}
                        title="학습"
                      />
                    )}
                    {ev?.quiz && (
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-info"
                        title="퀴즈"
                      />
                    )}
                    {ev?.assignment && (
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-gold-500"
                        title="과제 마감"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-4 border-t border-cream-100 pt-4 text-xs text-forest-950/55">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-success" /> 강의 수강
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-info" /> 퀴즈
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-gold-500" /> 과제 마감
            </span>
          </div>
        </section>

        {/* 오늘 일정 */}
        <aside className="space-y-5">
          <section className="card p-5">
            <h3 className="mb-3.5 flex items-center gap-1.5 text-sm font-bold text-forest-950">
              <CalendarCheck2 size={15} className="text-forest-600" />
              오늘의 학습 일정
            </h3>
            <div className="rounded-xl bg-forest-950 p-4 text-cream-50">
              <p className="text-xs text-cream-200/60">오늘의 미션</p>
              <p className="mt-1 font-display text-lg font-semibold">
                {doneMissions}/{store.state.missions.length} 완료
              </p>
              <p className="mt-1 text-xs text-cream-200/70">
                {doneMissions === store.state.missions.length
                  ? "오늘 목표 달성! 멋져요 🎉"
                  : "오늘의 학습 미션을 완료해보세요."}
              </p>
              <Link
                href="/"
                className="btn-press mt-3 inline-block rounded-full bg-cream-100 px-4 py-2 text-xs font-bold text-forest-950"
              >
                미션 확인하기
              </Link>
            </div>
            <p className="mt-3 text-center text-xs text-forest-950/50">
              {store.state.streakDays}일 연속 학습 중이에요 🔥
            </p>
          </section>

          <section className="card p-5">
            <h3 className="mb-3.5 flex items-center gap-1.5 text-sm font-bold text-forest-950">
              <ClipboardList size={15} className="text-forest-600" />
              다가오는 과제 마감
            </h3>
            {upcomingAssignments.length === 0 ? (
              <p className="text-sm text-forest-950/50">
                남아있는 과제가 없어요. 여유롭게 학습을 이어가세요.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {upcomingAssignments.map((a) => (
                  <li key={a.id}>
                    <Link
                      href="/quiz"
                      className="block rounded-xl border border-cream-200 p-3.5 transition-colors hover:border-forest-300"
                    >
                      <p className="text-sm font-semibold text-forest-950">
                        {a.title}
                      </p>
                      <p className="mt-0.5 text-xs text-forest-950/50">
                        {getCourse(a.courseId)?.title} · 마감 {a.dueDate}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card p-5">
            <h3 className="mb-3.5 flex items-center gap-1.5 text-sm font-bold text-forest-950">
              <PenSquare size={15} className="text-forest-600" />
              추천 퀴즈
            </h3>
            <ul className="space-y-2.5">
              {QUIZZES.slice(0, 2).map((q) => (
                <li key={q.id}>
                  <Link
                    href={`/quiz/${q.id}`}
                    className="flex items-center gap-2.5 rounded-xl border border-cream-200 p-3.5 transition-colors hover:border-forest-300"
                  >
                    <BookOpen size={16} className="shrink-0 text-forest-500" />
                    <span className="text-sm font-semibold text-forest-950">
                      {q.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
