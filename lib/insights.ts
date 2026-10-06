import { QUIZZES } from "./data";
import type { Quiz } from "./types";
import type { WeakQuestion } from "./learning";

export interface WeakGroup {
  quiz: Quiz;
  count: number;
  topics: string[];
}

/** 틀린 문항을 퀴즈 단위로 묶는다. 가장 많이 틀린 퀴즈가 먼저 온다. */
export function groupWeak(weak: WeakQuestion[]): WeakGroup[] {
  const groups: WeakGroup[] = [];
  for (const quiz of QUIZZES) {
    const mine = weak.filter((w) => w.quizId === quiz.id);
    if (mine.length === 0) continue;
    groups.push({
      quiz,
      count: mine.length,
      topics: Array.from(new Set(mine.map((w) => w.topic))),
    });
  }
  return groups.sort((a, b) => b.count - a.count);
}

/** 주간 목표 대비 남은 시간을 사람이 읽는 문장으로. */
export function weeklyGoalMessage(total: number, goal: number): string {
  const left = goal - total;
  if (left <= 0) return "이번 주 목표를 달성했어요";
  if (left < 60) return `이번 주 목표까지 ${left}분 남았어요`;
  const h = Math.floor(left / 60);
  const m = left % 60;
  return `이번 주 목표까지 ${h}시간${m ? ` ${m}분` : ""} 남았어요`;
}
