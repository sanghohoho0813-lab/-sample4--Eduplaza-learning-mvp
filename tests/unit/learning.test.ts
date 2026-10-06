import { describe, expect, it } from "vitest";
import {
  WEEKLY_GOAL_MIN,
  computeLast7,
  computeStreak,
  computeWeakQuestions,
  dayKey,
  daysUntil,
  dueLabel,
  earnedAchievements,
} from "@/lib/learning";
import { QUIZZES } from "@/lib/data";
import type { Activity, QuizResult } from "@/lib/types";
import { seedState } from "@/lib/store";

// 2026-10-06(화) 15:00 로컬 시각으로 고정
const NOW = new Date(2026, 9, 6, 15, 0, 0);
const at = (daysAgo: number, hour = 20) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};
const lesson = (daysAgo: number, minutes = 10): Activity => ({
  id: `l-${daysAgo}-${minutes}-${Math.random()}`,
  type: "lesson",
  at: at(daysAgo),
  label: "레슨",
  minutes,
});

describe("날짜 헬퍼", () => {
  it("dayKey는 로컬 날짜를 YYYY-MM-DD로", () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("daysUntil은 오늘 0, 내일 1, 어제 -1", () => {
    expect(daysUntil("2026-10-06", NOW)).toBe(0);
    expect(daysUntil("2026-10-07", NOW)).toBe(1);
    expect(daysUntil("2026-10-05", NOW)).toBe(-1);
    expect(daysUntil("2026-11-01", NOW)).toBe(26); // 월 경계
  });

  it("dueLabel은 사람이 읽는 마감 표현", () => {
    expect(dueLabel(-2)).toBe("마감됨");
    expect(dueLabel(0)).toBe("오늘 마감");
    expect(dueLabel(1)).toBe("내일 마감");
    expect(dueLabel(5)).toBe("D-5");
  });
});

describe("연속 학습일 computeStreak", () => {
  it("기록이 없으면 0", () => {
    expect(computeStreak([], NOW)).toBe(0);
  });

  it("오늘 아직 안 했어도 어제까지 이어졌으면 유지", () => {
    expect(computeStreak([lesson(1), lesson(2), lesson(3)], NOW)).toBe(3);
  });

  it("오늘 학습하면 하루 늘어난다", () => {
    expect(computeStreak([lesson(0), lesson(1), lesson(2)], NOW)).toBe(3);
  });

  it("하루라도 비면 거기서 끊긴다", () => {
    expect(computeStreak([lesson(0), lesson(1), lesson(3), lesson(4)], NOW)).toBe(2);
  });

  it("수강 시작·성취는 학습일로 치지 않는다", () => {
    const enroll: Activity = { id: "e", type: "enroll", at: at(0), label: "x" };
    expect(computeStreak([enroll], NOW)).toBe(0);
  });
});

describe("최근 7일 computeLast7", () => {
  it("오늘 포함 7칸, 마지막 칸이 오늘", () => {
    const days = computeLast7([], NOW);
    expect(days).toHaveLength(7);
    expect(days[6]).toMatchObject({ key: "2026-10-06", isToday: true, label: "화" });
    expect(days[0].key).toBe("2026-09-30");
  });

  it("레슨 분만 합산하고 7일 밖은 제외", () => {
    const quiz: Activity = { id: "q", type: "quiz", at: at(0), label: "q", score: 90 };
    const days = computeLast7([lesson(0, 12), lesson(0, 8), lesson(6, 30), lesson(7, 99), quiz], NOW);
    expect(days[6].minutes).toBe(20);
    expect(days[0].minutes).toBe(30);
    expect(days.reduce((a, d) => a + d.minutes, 0)).toBe(50);
  });
});

describe("지금 틀려 있는 문항 computeWeakQuestions", () => {
  const quiz = QUIZZES[0];
  const ids = quiz.questions.map((q) => q.id);
  const right = quiz.questions.map((q) => q.answerIndex);
  const wrongAt = (idx: number[]) => right.map((a, i) => (idx.includes(i) ? (a + 1) % 4 : a));
  const result = (mode: "full" | "review", qids: string[], answers: number[], minute: number): QuizResult => ({
    id: `r${minute}`,
    quizId: quiz.id,
    mode,
    score: 0,
    correct: 0,
    total: qids.length,
    questionIds: qids,
    answers,
    date: new Date(2026, 9, 6, 10, minute).toISOString(),
  });

  it("전체 풀이에서 틀린 문항이 목록이 된다", () => {
    const weak = computeWeakQuestions([result("full", ids, wrongAt([1, 3]), 0)]);
    expect(weak.map((w) => w.questionId)).toEqual([ids[1], ids[3]]);
  });

  it("복습에서 맞힌 문항은 빠지고, 다시 틀린 문항은 남는다", () => {
    const weak = computeWeakQuestions([
      result("full", ids, wrongAt([1, 3]), 0),
      result("review", [ids[1], ids[3]], [right[1], (right[3] + 1) % 4], 5),
    ]);
    expect(weak.map((w) => w.questionId)).toEqual([ids[3]]);
  });

  it("새 전체 풀이는 이전 오답 목록을 덮어쓴다", () => {
    const weak = computeWeakQuestions([
      result("full", ids, wrongAt([1, 3]), 0),
      result("full", ids, wrongAt([0]), 10),
    ]);
    expect(weak.map((w) => w.questionId)).toEqual([ids[0]]);
  });

  it("저장 순서가 뒤섞여 있어도 시간순으로 계산한다", () => {
    const weak = computeWeakQuestions([
      result("review", [ids[1]], [right[1]], 5),
      result("full", ids, wrongAt([1]), 0),
    ]);
    expect(weak).toEqual([]);
  });
});

describe("성취 판정 earnedAchievements", () => {
  it("시드 상태에서는 새로 받을 성취가 없다(이미 해금된 것 제외)", () => {
    const s = seedState();
    expect(earnedAchievements(s)).toEqual([]);
  });

  it("주간 목표를 넘기면 weekly-goal", () => {
    const s = { ...seedState(), unlockedAchievements: [] as string[], activity: [lesson(0, WEEKLY_GOAL_MIN)] };
    expect(earnedAchievements(s, NOW)).toContain("weekly-goal");
  });

  it("이미 해금된 성취는 다시 주지 않는다", () => {
    const s = {
      ...seedState(),
      unlockedAchievements: ["weekly-goal"],
      activity: [lesson(0, WEEKLY_GOAL_MIN)],
    };
    expect(earnedAchievements(s, NOW)).not.toContain("weekly-goal");
  });
});
