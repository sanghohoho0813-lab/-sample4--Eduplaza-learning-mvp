import { describe, expect, it } from "vitest";
import { DEFAULT_NOTIFICATIONS, sanitizeState } from "@/lib/persist";
import { seedState } from "@/lib/store";

describe("저장 데이터 복원 sanitizeState", () => {
  it("정상 데이터는 그대로 돌아온다(알림 설정 기본값만 채움)", () => {
    const seed = seedState();
    const restored = sanitizeState(JSON.parse(JSON.stringify(seed)));
    expect(restored).toEqual({ ...seed, notifications: seed.notifications ?? DEFAULT_NOTIFICATIONS });
  });

  it("핵심 구조가 없으면 null — 시드로 시작하게 한다", () => {
    expect(sanitizeState(null)).toBeNull();
    expect(sanitizeState("hello")).toBeNull();
    expect(sanitizeState({ name: "x" })).toBeNull();
  });

  it("없어진 강의·레슨, 중복 수강, 깨진 항목은 버린다", () => {
    const seed = seedState();
    const dirty = {
      ...JSON.parse(JSON.stringify(seed)),
      enrollments: [
        ...seed.enrollments,
        { courseId: "c-deleted", enrolledAt: new Date().toISOString() },
        { ...seed.enrollments[0] }, // 중복
        { courseId: "c1" }, // 날짜 없음
      ],
      lessonProgress: { ...seed.lessonProgress, "zz-lesson": "completed", "c1-s1-l1": "weird" },
      favorites: ["c13", "c13", "nope"],
      activity: [...seed.activity, { id: "x", type: "hack", at: "yesterday", label: 1 }],
      quizResults: [...seed.quizResults, { id: "bad", quizId: "q1", mode: "full", questionIds: ["a"], answers: [] }],
    };
    const restored = sanitizeState(dirty)!;
    expect(restored.enrollments).toHaveLength(seed.enrollments.length);
    expect(restored.lessonProgress["zz-lesson"]).toBeUndefined();
    expect(restored.lessonProgress["c1-s1-l1"]).toBeUndefined();
    expect(restored.favorites).toEqual(["c13"]);
    expect(restored.activity).toHaveLength(seed.activity.length);
    expect(restored.quizResults).toHaveLength(seed.quizResults.length);
  });

  it("이전 버전처럼 필드가 빠져 있으면 기본값으로 채운다", () => {
    const old = { enrollments: [], activity: [] };
    const restored = sanitizeState(old)!;
    expect(restored.notifications).toEqual(DEFAULT_NOTIFICATIONS);
    expect(restored.interests.length).toBeGreaterThan(0);
    expect(restored.unlockedAchievements).toEqual([]);
    expect(restored.name).toBe("김팀장");
  });
});
