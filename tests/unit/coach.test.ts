import { describe, expect, it } from "vitest";
import {
  bestDay,
  compareWeeks,
  coursePace,
  milestoneStatus,
  nextStepCourse,
  planToday,
  recommendCourses,
  stalledCourses,
  strengths,
  strongTopics,
  studyEstimate,
  weeklyActions,
} from "@/lib/coach";
import { COURSE_OUTCOMES } from "@/lib/outcomes";
import { computeLast7, earnedAchievements } from "@/lib/learning";
import { COURSES, getCourse, QUIZZES } from "@/lib/data";
import { seedState } from "@/lib/store";
import type { Activity, UserState } from "@/lib/types";

const NOW = new Date();
const at = (daysAgo: number, hour = 20) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};
const lesson = (daysAgo: number, minutes: number, courseId = "c1"): Activity => ({
  id: `l-${daysAgo}-${minutes}-${Math.random()}`,
  type: "lesson",
  at: at(daysAgo),
  label: "레슨",
  minutes,
  courseId,
});

describe("compareWeeks", () => {
  it("이번 주(오늘 포함 7일)와 그 이전 7일을 비교", () => {
    const r = compareWeeks([lesson(0, 30), lesson(6, 20), lesson(7, 15), lesson(13, 5), lesson(14, 99)], NOW);
    expect(r).toEqual({ thisWeek: 50, lastWeek: 20, hasLastWeek: true, diff: 30 });
  });

  it("지난주 기록이 없으면 비교하지 않는다고 알려준다", () => {
    expect(compareWeeks([lesson(1, 30)], NOW).hasLastWeek).toBe(false);
  });

  it("시드: 지난주에도 공부한 기록이 있어 비교 가능", () => {
    const r = compareWeeks(seedState().activity, NOW);
    expect(r.thisWeek).toBe(275);
    expect(r.hasLastWeek).toBe(true);
  });
});

describe("bestDay", () => {
  it("가장 많이 공부한 날, 기록이 없으면 null", () => {
    expect(bestDay(computeLast7([], NOW))).toBeNull();
    const best = bestDay(computeLast7([lesson(1, 10), lesson(2, 40), lesson(2, 5)], NOW));
    expect(best?.minutes).toBe(45);
  });
});

describe("coursePace", () => {
  it("최근 14일 속도로 완주 일수를 예측, 기록이 없으면 null", () => {
    const s = seedState();
    const c1 = coursePace(s, getCourse("c1")!, NOW);
    expect(c1.remainingLessons).toBe(4);
    expect(c1.etaDays).toBeGreaterThan(0);
    const fresh = coursePace({ ...s, activity: [] }, getCourse("c1")!, NOW);
    expect(fresh.etaDays).toBeNull();
  });

  it("다 들은 강의는 0일", () => {
    expect(coursePace(seedState(), getCourse("c11")!, NOW).etaDays).toBe(0);
  });
});

describe("strongTopics", () => {
  it("최근 전체 풀이에서 모두 맞혔고 지금 틀린 문제가 없는 주제만", () => {
    const s = seedState();
    const strong = strongTopics(s, 99);
    const weakTopics = ["결측치 처리", "기초 통계"];
    expect(strong.length).toBeGreaterThan(0);
    for (const t of weakTopics) expect(strong).not.toContain(t);
  });

  it("퀴즈를 푼 적이 없으면 강점도 없다", () => {
    expect(strongTopics({ ...seedState(), quizResults: [] })).toEqual([]);
  });
});

describe("planToday", () => {
  it("시드(오늘 기록 없음): 레슨 → 복습 → 급한 과제, 모두 미완료", () => {
    const plan = planToday(seedState(), NOW);
    expect(plan.map((p) => p.id)).toEqual(["lesson", "review", "assignment"]);
    expect(plan.every((p) => !p.done)).toBe(true);
    expect(plan[0].href).toMatch(/^\/learn\/c1\?lesson=/);
    expect(plan[1].href).toMatch(/mode=review/);
    expect(plan[2].detail).toMatch(/내일 마감/);
  });

  it("오늘 레슨을 들으면 그 기록으로 완료 표시", () => {
    const s = seedState();
    const done: UserState = { ...s, activity: [{ ...lesson(0, 22), label: "EDA 실습" }, ...s.activity] };
    const plan = planToday(done, NOW);
    expect(plan[0]).toMatchObject({ id: "lesson", done: true, title: "EDA 실습" });
    expect(plan[0].doneAt).toBeTruthy();
  });

  it("틀린 문제가 없으면 아직 안 푼 퀴즈를, 급한 과제가 없으면 메모를 권한다", () => {
    const s = seedState();
    const plan = planToday({ ...s, quizResults: [], enrollments: s.enrollments.filter((e) => e.courseId === "c2") }, NOW);
    expect(plan.map((p) => p.id)).toEqual(["lesson", "quiz", "note"]);
  });
});

describe("weeklyActions", () => {
  it("급한 과제 → 복습 → 주간 목표 순, 최대 3개", () => {
    const actions = weeklyActions(seedState(), NOW);
    expect(actions.length).toBeLessThanOrEqual(3);
    expect(actions[0].urgent).toBe(true);
    expect(actions.map((a) => a.id)).toContain("weak");
  });

  it("할 일이 없으면 빈 배열(지어내지 않음)", () => {
    const s = seedState();
    const idle: UserState = { ...s, enrollments: [], quizResults: [], assignments: {} };
    expect(weeklyActions(idle, NOW)).toEqual([]);
  });
});

describe("recommendCourses", () => {
  it("수강 중인 강의는 추천하지 않고, 이유를 붙인다", () => {
    const s = seedState();
    const recs = recommendCourses(s, 3);
    expect(recs).toHaveLength(3);
    for (const r of recs) {
      expect(s.enrollments.some((e) => e.courseId === r.course.id)).toBe(false);
      expect(r.reason.length).toBeGreaterThan(0);
    }
  });
});

describe("성취: 오답 정복", () => {
  it("복습으로 틀린 문제를 모두 고치면 해금", () => {
    const s = seedState();
    const q1 = QUIZZES.find((q) => q.id === "q1")!;
    const q2 = QUIZZES.find((q) => q.id === "q2")!;
    const fix = (quiz: typeof q1, ids: string[], i: number) => ({
      id: `rv${i}`,
      quizId: quiz.id,
      mode: "review" as const,
      score: 100,
      correct: ids.length,
      total: ids.length,
      questionIds: ids,
      answers: ids.map((id) => quiz.questions.find((q) => q.id === id)!.answerIndex),
      date: new Date().toISOString(),
    });
    const solved: UserState = {
      ...s,
      quizResults: [...s.quizResults, fix(q1, ["q1-4", "q1-7"], 1), fix(q2, ["q2-2"], 2)],
    };
    expect(earnedAchievements(solved)).toContain("weak-cleared");
    expect(earnedAchievements(s)).not.toContain("weak-cleared");
  });
});

describe("studyEstimate", () => {
  it("하루 30분 기준 일수는 남은 레슨 시간으로, 내 페이스는 기록이 있을 때만", () => {
    const s = seedState();
    const c1 = getCourse("c1")!;
    const e = studyEstimate(s, c1, NOW);
    expect(e.minutes).toBe(81); // 남은 레슨 4개
    expect(e.days).toBe(3);
    expect(e.myDailyMin).toBe(39); // 최근 7일 275분 / 7
    expect(e.myDays).toBe(3);

    const empty = studyEstimate({ ...s, activity: [] }, getCourse("c7")!, NOW);
    expect(empty.minutes).toBe(getCourse("c7")!.totalMinutes);
    expect(empty.myDailyMin).toBeNull();
    expect(empty.myDays).toBeNull();
  });
});

describe("nextStepCourse", () => {
  it("같은 분야의 더 높은 난이도를 먼저, 없으면 같은 분야의 다른 강의", () => {
    const step = nextStepCourse(getCourse("c7")!); // 개발 · 입문
    expect(step?.course.categoryId).toBe("dev");
    expect(step?.course.level).not.toBe("beginner");
    for (const c of COURSES) {
      const r = nextStepCourse(c);
      if (r) expect(r.course.id).not.toBe(c.id);
    }
  });
});

describe("강의 학습 성과 데이터", () => {
  it("모든 강의에 배우는 것 3개와 결과물이 있다", () => {
    for (const c of COURSES) {
      expect(COURSE_OUTCOMES[c.id]?.skills).toHaveLength(3);
      expect(COURSE_OUTCOMES[c.id]?.project.length).toBeGreaterThan(0);
    }
  });
});

describe("stalledCourses", () => {
  it("7일 이상 손대지 않은 미완주 강의만, 오래된 순", () => {
    const s = seedState();
    expect(stalledCourses(s, NOW)).toEqual([]); // 시드는 모두 최근에 공부
    const old = {
      ...s,
      enrollments: s.enrollments.map((e) =>
        e.courseId === "c3" ? { ...e, lastStudiedAt: at(12) } : e.courseId === "c2" ? { ...e, lastStudiedAt: at(8) } : e
      ),
    };
    const r = stalledCourses(old, NOW);
    expect(r.map((x) => [x.course.id, x.idleDays])).toEqual([
      ["c3", 12],
      ["c2", 8],
    ]);
    // 완주한 강의(c11)는 오래돼도 멈춘 강의가 아니다
    expect(r.some((x) => x.course.id === "c11")).toBe(false);
    expect(weeklyActions(old, NOW, 10).some((a) => a.id === "resume-c3")).toBe(true);
  });
});

describe("strengths", () => {
  it("기록으로 확인되는 것만 — 시드는 지난주 대비 증가와 연속 학습", () => {
    const ids = strengths(seedState(), NOW, 10).map((h) => h.id);
    expect(ids).toContain("more");
    expect(ids).toContain("streak");
    expect(ids).not.toContain("goal"); // 275분 < 300분
  });

  it("기록이 없으면 칭찬도 없다", () => {
    const s = seedState();
    expect(strengths({ ...s, activity: [], quizResults: [] }, NOW)).toEqual([]);
  });
});

describe("milestoneStatus", () => {
  it("달성 여부와 아직이면 현재 위치를 함께", () => {
    const m = milestoneStatus(seedState(), NOW);
    expect(m).toHaveLength(7);
    expect(m.filter((x) => x.done).map((x) => x.id)).toEqual(["first-lesson", "first-course", "streak-3", "streak-7"]);
    expect(m.find((x) => x.id === "quiz-100")?.progress).toBe("최고 86점");
    expect(m.find((x) => x.id === "weak-cleared")?.progress).toBe("틀린 문제 3개 남음");
    expect(m.find((x) => x.id === "weekly-goal")?.progress).toBe("4시간 35분 / 5시간");
  });
});
