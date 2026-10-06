import { describe, expect, it } from "vitest";
import { groupWeak, weeklyGoalMessage } from "@/lib/insights";

describe("weeklyGoalMessage", () => {
  it.each([
    [300, 300, "이번 주 목표를 달성했어요"],
    [320, 300, "이번 주 목표를 달성했어요"],
    [275, 300, "이번 주 목표까지 25분 남았어요"],
    [180, 300, "이번 주 목표까지 2시간 남았어요"],
    [155, 300, "이번 주 목표까지 2시간 25분 남았어요"],
  ])("%i분 / %i분 → %s", (total, goal, msg) => {
    expect(weeklyGoalMessage(total, goal)).toBe(msg);
  });
});

describe("groupWeak", () => {
  it("퀴즈별로 묶고 많이 틀린 퀴즈가 먼저, 주제는 중복 없이", () => {
    const groups = groupWeak([
      { quizId: "q2", questionId: "q2-1", topic: "A" },
      { quizId: "q1", questionId: "q1-1", topic: "B" },
      { quizId: "q1", questionId: "q1-2", topic: "B" },
    ]);
    expect(groups.map((g) => [g.quiz.id, g.count, g.topics])).toEqual([
      ["q1", 2, ["B"]],
      ["q2", 1, ["A"]],
    ]);
  });
});
