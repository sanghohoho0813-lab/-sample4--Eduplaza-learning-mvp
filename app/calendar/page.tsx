"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ChevronLeft, ChevronRight, ClipboardList, Flame } from "lucide-react";
import { ASSIGNMENTS, getCourse } from "@/lib/data";
import { dayKey, dueLabel, useStore } from "@/lib/store";
import { Header } from "@/components/Header";
import { ActivityTabs } from "@/components/ActivityTabs";
import { ActivityList } from "@/components/ActivityList";
import { ListSkeleton } from "@/components/Skeletons";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

interface DayMarks {
  lesson?: boolean;
  quiz?: boolean;
  due?: boolean;
  any?: boolean;
}

export default function CalendarPage() {
  const store = useStore();
  const today = new Date();
  const todayKey = dayKey(today);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(todayKey);

  // 캘린더 표시는 저장된 숫자가 아니라 실제 활동 로그와 과제 마감일에서 만든다.
  const marks = useMemo(() => {
    const map = new Map<string, DayMarks>();
    const put = (key: string, patch: DayMarks) => map.set(key, { ...map.get(key), ...patch });
    for (const a of store.state.activity) {
      const key = dayKey(new Date(a.at));
      if (a.type === "lesson") put(key, { lesson: true, any: true });
      else if (a.type === "quiz" || a.type === "review") put(key, { quiz: true, any: true });
      else if (a.type !== "enroll" && a.type !== "achievement") put(key, { any: true });
    }
    for (const u of store.upcomingAssignments) put(u.due, { due: true });
    return map;
  }, [store.state.activity, store.upcomingAssignments]);

  if (!store.ready) {
    return (
      <div>
        <Header title="학습 활동" />
        <ListSkeleton rows={4} />
      </div>
    );
  }

  const startOffset = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const move = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const dayActivity = store.state.activity.filter((a) => dayKey(new Date(a.at)) === selected);
  const dayDue = ASSIGNMENTS.filter(
    (a) => store.assignmentDue(a.id) === selected && store.assignmentStatus(a.id) === "pending"
  );
  const dayMinutes = dayActivity.reduce((s, a) => s + (a.type === "lesson" ? a.minutes ?? 0 : 0), 0);
  const [, sm, sd] = selected.split("-").map(Number);
  const selectedLabel = selected === todayKey ? "오늘" : `${sm}월 ${sd}일`;

  return (
    <div className="animate-fade-up">
      <Header title="학습 활동" subtitle="날짜를 눌러 그날의 학습 기록을 확인하세요." />
      <ActivityTabs
        active="calendar"
        counts={{ assignment: store.upcomingAssignments.length || undefined }}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr),360px]">
        <section className="card p-5 md:p-6" aria-labelledby="month-heading">
          <div className="mb-5 flex items-center justify-between">
            <h2 id="month-heading" className="font-display text-lg font-semibold text-forest-950">
              {year}년 {month + 1}월
            </h2>
            <div className="flex gap-1.5">
              <button
                onClick={() => move(-1)}
                className="btn-press flex h-11 w-11 items-center justify-center rounded-full border border-cream-300 text-forest-800"
                aria-label="이전 달"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => move(1)}
                className="btn-press flex h-11 w-11 items-center justify-center rounded-full border border-cream-300 text-forest-800"
                aria-label="다음 달"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((w, i) => (
              <div
                key={w}
                className={clsx(
                  "pb-2 text-xs font-bold",
                  i === 0 ? "text-danger/70" : i === 6 ? "text-info" : "text-forest-950/45"
                )}
              >
                {w}
              </div>
            ))}
            {cells.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} />;
              const key = dayKey(new Date(year, month, day));
              const m = marks.get(key);
              const isToday = key === todayKey;
              const isSelected = key === selected;
              return (
                <button
                  key={key}
                  onClick={() => setSelected(key)}
                  aria-pressed={isSelected}
                  aria-label={`${month + 1}월 ${day}일${m?.any ? ", 학습 기록 있음" : ""}${m?.due ? ", 과제 마감" : ""}`}
                  className={clsx(
                    "relative flex aspect-square min-h-[44px] flex-col items-center justify-center rounded-xl text-sm transition-colors md:aspect-auto md:min-h-[64px]",
                    isSelected
                      ? "bg-forest-950 font-bold text-cream-50 shadow-glow"
                      : m?.any
                        ? "bg-forest-50 text-forest-950 hover:bg-forest-100"
                        : "text-forest-950/70 hover:bg-cream-100",
                    isToday && !isSelected && "ring-2 ring-forest-400"
                  )}
                >
                  {day}
                  <span className="mt-1 flex h-1.5 items-center gap-0.5" aria-hidden>
                    {m?.lesson && (
                      <span className={clsx("h-1.5 w-1.5 rounded-full", isSelected ? "bg-cream-100" : "bg-forest-600")} />
                    )}
                    {m?.quiz && <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />}
                    {m?.due && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-4 border-t border-cream-100 pt-4 text-xs text-forest-950/55">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-forest-600" /> 레슨
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-teal-400" /> 퀴즈
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> 과제 마감
            </span>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="card p-5" aria-labelledby="day-heading">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="day-heading" className="text-base font-bold text-forest-950">
                {selectedLabel}의 학습
              </h2>
              {dayMinutes > 0 && (
                <span className="text-sm font-semibold text-forest-700">{dayMinutes}분</span>
              )}
            </div>
            {dayDue.map((a) => (
              <Link
                key={a.id}
                href={`/quiz?tab=assignment#${a.id}`}
                className="mt-3 flex min-h-[48px] items-center gap-2.5 rounded-xl bg-amber-50 px-3.5 text-sm font-semibold text-amber-600"
              >
                <ClipboardList size={16} className="shrink-0" />
                <span className="truncate">{a.title} 마감</span>
              </Link>
            ))}
            <ActivityList
              items={dayActivity}
              showTime={false}
              empty={
                selected === todayKey
                  ? "아직 오늘 기록이 없어요. 레슨 하나로 시작해볼까요?"
                  : "이날은 학습 기록이 없어요."
              }
            />
            {selected === todayKey && dayActivity.length === 0 && (
              <Link
                href="/"
                className="btn-press mt-2 inline-flex min-h-[48px] items-center rounded-full bg-forest-900 px-5 text-sm font-bold text-cream-50"
              >
                오늘 학습하러 가기
              </Link>
            )}
          </section>

          <section className="card p-5" aria-labelledby="due-heading">
            <h2 id="due-heading" className="mb-2 text-base font-bold text-forest-950">
              다가오는 과제 마감
            </h2>
            {store.upcomingAssignments.length === 0 ? (
              <p className="text-sm text-forest-950/55">남은 과제가 없어요.</p>
            ) : (
              <ul className="divide-y divide-cream-100">
                {store.upcomingAssignments.map((u) => (
                  <li key={u.assignment.id}>
                    <Link
                      href={`/quiz?tab=assignment#${u.assignment.id}`}
                      className="flex min-h-[56px] items-center justify-between gap-3 py-2.5"
                    >
                      <span className="min-w-0">
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
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 flex items-center gap-1.5 border-t border-cream-100 pt-3 text-sm text-forest-950/65">
              <Flame size={15} className="text-gold-500" />
              {store.streak > 0 ? `${store.streak}일 연속 학습 중이에요` : "오늘 학습하면 연속 기록이 시작돼요"}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
