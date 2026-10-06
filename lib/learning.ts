// 학습 도메인 로직 — React·화면과 무관한 순수 함수만 둔다.
// 연속 학습일·최근 7일 시간·지금 틀려 있는 문항·성취 판정은 모두 활동 로그와
// 퀴즈 기록에서 "계산"되며, 시간에 의존하는 함수는 now를 받아 테스트에서 고정할 수 있다.

import { QUIZZES, courseLessons, getCourse } from "./data";
import type { Activity, QuizResult, UserState } from "./types";

export const WEEKLY_GOAL_MIN = 300; // 최근 7일 기준 5시간

const STUDY_TYPES = new Set(["lesson", "quiz", "review", "assignment", "note"]);
const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

// ---------- 날짜 헬퍼 ----------

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}


/** 오늘 기준 남은 일수. 오늘 마감이면 0, 지났으면 음수. */
export function daysUntil(key: string, now: Date = new Date()): number {
  const [y, m, d] = key.split("-").map(Number);
  const due = new Date(y, m - 1, d).getTime();
  const t = now;
  const today = new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
  return Math.round((due - today) / 86400000);
}

export function dueLabel(dLeft: number): string {
  if (dLeft < 0) return "마감됨";
  if (dLeft === 0) return "오늘 마감";
  if (dLeft === 1) return "내일 마감";
  return `D-${dLeft}`;
}

// ---------- 로그 기반 파생값 (순수 함수) ----------

export function computeStreak(activity: Activity[], now: Date = new Date()): number {
  const days = new Set(
    activity.filter((a) => STUDY_TYPES.has(a.type)).map((a) => dayKey(new Date(a.at)))
  );
  const cursor = new Date(now);
  // 오늘 아직 안 했어도 어제까지 이어졌으면 연속 기록은 살아 있다.
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let n = 0;
  while (days.has(dayKey(cursor))) {
    n++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return n;
}

export interface DayMinutes {
  key: string;
  label: string; // 요일
  minutes: number;
  isToday: boolean;
}

export function computeLast7(activity: Activity[], now: Date = new Date()): DayMinutes[] {
  const out: DayMinutes[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    const minutes = activity
      .filter((a) => a.type === "lesson" && dayKey(new Date(a.at)) === key)
      .reduce((sum, a) => sum + (a.minutes ?? 0), 0);
    out.push({ key, label: WEEKDAY[d.getDay()], minutes, isToday: i === 0 });
  }
  return out;
}

export interface WeakQuestion {
  quizId: string;
  questionId: string;
  topic: string;
}

/**
 * 퀴즈별로 시간순으로 시도를 따라가며 "지금 틀려 있는 문항"을 구한다.
 * 전체 풀이는 오답 목록을 새로 정하고, 복습 풀이는 맞힌 문항을 목록에서 지운다.
 */
export function computeWeakQuestions(results: QuizResult[]): WeakQuestion[] {
  const out: WeakQuestion[] = [];
  for (const quiz of QUIZZES) {
    const attempts = results
      .filter((r) => r.quizId === quiz.id)
      .sort((a, b) => a.date.localeCompare(b.date));
    let wrong = new Set<string>();
    for (const r of attempts) {
      if (r.mode === "full") wrong = new Set();
      r.questionIds.forEach((qid, i) => {
        const q = quiz.questions.find((x) => x.id === qid);
        if (!q) return;
        if (r.answers[i] === q.answerIndex) wrong.delete(qid);
        else wrong.add(qid);
      });
    }
    for (const q of quiz.questions) {
      if (wrong.has(q.id)) out.push({ quizId: quiz.id, questionId: q.id, topic: q.topic });
    }
  }
  return out;
}

// ---------- 성취 판정 ----------

export const ACHIEVEMENT_IDS = [
  "first-lesson",
  "first-course",
  "streak-3",
  "streak-7",
  "quiz-100",
  "weekly-goal",
] as const;

/** 아직 해금되지 않았지만 지금 조건을 만족하는 성취 id 목록 */
export function earnedAchievements(s: UserState, now: Date = new Date()): string[] {
  const has = new Set(s.unlockedAchievements);
  const completed = Object.values(s.lessonProgress).filter((v) => v === "completed").length;
  const streak = computeStreak(s.activity, now);
  const weekly = computeLast7(s.activity, now).reduce((a, d) => a + d.minutes, 0);
  const anyCourseDone = s.enrollments.some((e) => {
    const c = getCourse(e.courseId);
    return c ? courseLessons(c).every((l) => s.lessonProgress[l.id] === "completed") : false;
  });
  const met: Record<(typeof ACHIEVEMENT_IDS)[number], boolean> = {
    "first-lesson": completed > 0,
    "first-course": anyCourseDone,
    "streak-3": streak >= 3,
    "streak-7": streak >= 7,
    "quiz-100": s.quizResults.some((r) => r.mode === "full" && r.score === 100),
    "weekly-goal": weekly >= WEEKLY_GOAL_MIN,
  };
  return ACHIEVEMENT_IDS.filter((id) => met[id] && !has.has(id));
}
