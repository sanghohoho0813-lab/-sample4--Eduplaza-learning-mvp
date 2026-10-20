"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ChevronLeft, ChevronRight, ClipboardList, Flame } from "lucide-react";
import { formatMinutes, getCourse } from "@/lib/data";
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
  /** 그날 끝낸 레슨 시간(분) — 칸의 색 농도 */
  minutes?: number;
}

/** 학습 시간 → 색 농도 4단계. 기록이 없으면 칠하지 않는다 */
const HEAT = [
  { min: 1, cls: "bg-forest-50" },
  { min: 21, cls: "bg-forest-100" },
  { min: 46, cls: "bg-forest-200" },
  { min: 71, cls: "bg-forest-300" },
];
const heatOf = (m?: DayMarks) =>
  !m?.any ? "" : [...HEAT].reverse().find((h) => (m.minutes ?? 0) >= h.min)?.cls ?? "bg-forest-50";

const WEEKDAY_LONG = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

export default function CalendarPage() {
  const store = useStore();
  const today = new Date();
  const todayKey = dayKey(today);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(todayKey);
  const dayRef = useRef<HTMLElement>(null);

  // 캘린더 표시는 저장된 숫자가 아니라 실제 활동 로그와 과제 마감일에서 만든다.
  const marks = useMemo(() => {
    const map = new Map<string, DayMarks>();
    const put = (key: string, patch: DayMarks) => map.set(key, { ...map.get(key), ...patch });
    for (const a of store.state.activity) {
      const key = dayKey(new Date(a.at));
      if (a.type === "lesson")
        put(key, { lesson: true, any: true, minutes: (map.get(key)?.minutes ?? 0) + (a.minutes ?? 0) });
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

  // 모바일에서는 기록 패널이 달력 아래에 있으므로, 날짜를 누르면 패널이 보이도록 살짝 내려준다
  const selectDay = (key: string) => {
    setSelected(key);
    requestAnimationFrame(() => {
      const el = dayRef.current;
      if (!el || window.innerWidth >= 1024) return;
      const r = el.getBoundingClientRect();
      if (r.top > window.innerHeight - 160) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelected(todayKey);
  };
  const current = store.currentCourse();
  const nextL = current ? store.nextLesson(current.id) : null;
  const studyHref = current && nextL ? `/learn/${current.id}?lesson=${nextL.id}` : "/courses";

  const move = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  // 이번 달 요약 — 칸을 하나하나 세지 않아도 한 달의 리듬이 보이게
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
  const monthDays = Array.from(marks.entries()).filter(([k, m]) => k.startsWith(monthPrefix) && m.any);
  const monthMinutes = monthDays.reduce((s, [, m]) => s + (m.minutes ?? 0), 0);
  // 수강 중인 강의의 아직 내지 않은 과제만 센다
  const monthDue = store.upcomingAssignments.filter((u) => u.due.startsWith(monthPrefix)).length;

  // 하루 기록은 아침부터 밤까지 순서대로
  const dayActivity = store.state.activity
    .filter((a) => dayKey(new Date(a.at)) === selected && a.type !== "enroll")
    .sort((a, b) => a.at.localeCompare(b.at));
  const dayDue = store.upcomingAssignments.filter((u) => u.due === selected).map((u) => u.assignment);
  const dayMinutes = dayActivity.reduce((s, a) => s + (a.type === "lesson" ? a.minutes ?? 0 : 0), 0);
  const [sy, sm, sd] = selected.split("-").map(Number);
  const selectedLabel = selected === todayKey ? "오늘" : `${sm}월 ${sd}일`;
  const selectedWeekday = WEEKDAY_LONG[new Date(sy, sm - 1, sd).getDay()];
  const dayCounts = [
    dayActivity.filter((a) => a.type === "lesson").length > 0 &&
      `레슨 ${dayActivity.filter((a) => a.type === "lesson").length}개`,
    dayActivity.filter((a) => a.type === "quiz" || a.type === "review").length > 0 &&
      `퀴즈 ${dayActivity.filter((a) => a.type === "quiz" || a.type === "review").length}회`,
    dayActivity.filter((a) => a.type === "note").length > 0 && `메모 ${dayActivity.filter((a) => a.type === "note").length}개`,
  ].filter(Boolean);

  return (
    <div className="animate-fade-up">
      <Header title="학습 활동" />
      <ActivityTabs
        active="calendar"
        counts={{ assignment: store.upcomingAssignments.length || undefined }}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr),360px]">
        <section className="card p-5 md:p-6" aria-labelledby="month-heading">
          <div className="mb-2 flex items-center justify-between">
            <h2 id="month-heading" className="font-display text-lg font-semibold text-forest-950 md:text-xl">
              {year}년 {month + 1}월
            </h2>
            <div className="flex items-center gap-1.5">
              {!isCurrentMonth && (
                <button
                  onClick={goToday}
                  className="btn-press min-h-[44px] rounded-full px-3.5 text-sm font-semibold text-forest-600 hover:bg-cream-100"
                >
                  오늘
                </button>
              )}
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

          <p className="mb-5 text-sm text-forest-950/72">
            {monthDays.length > 0 ? (
              <>
                <b className="font-semibold text-forest-950">{monthDays.length}일</b> 공부했어요 · 레슨{" "}
                <b className="font-semibold text-forest-950">{formatMinutes(monthMinutes)}</b>
                {monthDue > 0 && <> · 과제 마감 {monthDue}건</>}
              </>
            ) : (
              <>이달에는 아직 학습 기록이 없어요{monthDue > 0 && ` · 과제 마감 ${monthDue}건`}</>
            )}
          </p>

          <div className="grid grid-cols-7 gap-1 text-center md:gap-1.5">
            {WEEKDAYS.map((w, i) => (
              <div
                key={w}
                className={clsx(
                  "pb-2 text-xs font-bold",
                  i === 0 ? "text-danger/70" : i === 6 ? "text-info" : "text-forest-950/68"
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
                  onClick={() => selectDay(key)}
                  aria-pressed={isSelected}
                  aria-label={`${month + 1}월 ${day}일${m?.minutes ? `, 학습 ${m.minutes}분` : m?.any ? ", 학습 기록 있음" : ""}${m?.quiz ? ", 퀴즈" : ""}${m?.due ? ", 과제 마감" : ""}`}
                  className={clsx(
                    "relative flex aspect-square min-h-[44px] flex-col items-center justify-center rounded-xl text-sm transition-colors md:aspect-auto md:min-h-[72px] md:justify-start md:pt-2.5",
                    isSelected
                      ? "bg-forest-950 font-bold text-cream-50 shadow-glow"
                      : m?.any
                        ? clsx(heatOf(m), "font-semibold text-forest-950 hover:ring-2 hover:ring-forest-300")
                        : "text-forest-950/70 hover:bg-cream-100",
                    isToday && !isSelected && "ring-2 ring-forest-500"
                  )}
                >
                  {day}
                  {m?.minutes ? (
                    <span
                      className={clsx(
                        "mt-0.5 hidden text-xs font-medium md:block",
                        isSelected ? "text-cream-200/80" : "text-forest-950/68"
                      )}
                    >
                      {m.minutes}분
                    </span>
                  ) : null}
                  {/* 퀴즈·마감은 모서리 점으로 — 색 농도(학습 시간)와 겹치지 않게 */}
                  <span className="absolute right-1.5 top-1.5 flex gap-0.5" aria-hidden>
                    {m?.quiz && <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />}
                    {m?.due && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-cream-100 pt-4 text-xs text-forest-950/68">
            <span className="inline-flex items-center gap-1.5">
              학습 시간
              <span className="ml-1 flex gap-1" aria-hidden>
                {HEAT.map((h) => (
                  <span key={h.min} className={clsx("h-3.5 w-3.5 rounded", h.cls)} />
                ))}
              </span>
              <span className="sr-only">: 색이 진할수록 많이 공부한 날</span>
              <span aria-hidden>많이</span>
            </span>
            <span className="flex gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-teal-500" /> 퀴즈
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> 과제 마감
              </span>
            </span>
          </div>
        </section>

        <aside className="space-y-6">
          <section ref={dayRef} className="card scroll-mt-4 p-5" aria-labelledby="day-heading" aria-live="polite">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="day-heading" className="text-base font-bold text-forest-950">
                  {selectedLabel}의 학습
                </h2>
                <p className="mt-0.5 text-xs text-forest-950/68">
                  {selected === todayKey ? `${sm}월 ${sd}일 ${selectedWeekday}` : selectedWeekday}
                  {dayCounts.length > 0 && ` · ${dayCounts.join(" · ")}`}
                </p>
              </div>
              {dayMinutes > 0 && (
                <span className="shrink-0 rounded-full bg-forest-50 px-3 py-1 text-sm font-bold text-forest-700">
                  {formatMinutes(dayMinutes)}
                </span>
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
            <div className="mt-3" />
            <ActivityList
              items={dayActivity}
              timeline
              empty={
                selected === todayKey
                  ? "아직 오늘 기록이 없어요. 레슨 하나로 시작해볼까요?"
                  : "이날은 학습 기록이 없어요."
              }
            />
            {selected === todayKey && dayActivity.length === 0 && (
              <Link
                href={studyHref}
                className="btn-press mt-2 inline-flex min-h-[48px] items-center rounded-full bg-forest-900 px-5 text-sm font-bold text-cream-50"
              >
                {current && nextL ? "이어서 학습하기" : "강의 찾아보기"}
              </Link>
            )}
          </section>

          <section className="card p-5" aria-labelledby="due-heading">
            <h2 id="due-heading" className="mb-2 text-base font-bold text-forest-950">
              다가오는 과제 마감
            </h2>
            {store.upcomingAssignments.length === 0 ? (
              <p className="text-sm text-forest-950/68">남은 과제가 없어요.</p>
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
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 flex items-center gap-1.5 border-t border-cream-100 pt-3 text-sm text-forest-950/72">
              <Flame size={15} className="text-gold-500" />
              {store.streak > 0 ? `${store.streak}일 연속 학습 중이에요` : "오늘 학습하면 연속 기록이 시작돼요"}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
