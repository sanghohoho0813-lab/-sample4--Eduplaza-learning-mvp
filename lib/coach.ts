// 학습 코치 — "그래서 오늘 뭘 하면 되지?"에 답하는 계산을 모아 둔다.
// 전부 활동 로그·진도·퀴즈 기록에서 파생되는 순수 함수다. 화면은 결과를 보여주기만 하고,
// 근거가 부족하면(지난주 기록 없음 등) 숫자를 지어내지 않고 null/빈 배열을 돌려준다.

import { ASSIGNMENTS, COURSES, QUIZZES, courseLessons, formatMinutes, getCategory, getCourse } from "./data";
import {
  WEEKLY_GOAL_MIN,
  computeLast7,
  computeStreak,
  computeWeakQuestions,
  dayKey,
  daysUntil,
  dueLabel,
  type DayMinutes,
} from "./learning";
import { groupWeak } from "./insights";
import type { Activity, Course, CourseLevel, Lesson, UserState } from "./types";

const LEVEL_RANK: Record<CourseLevel, number> = { beginner: 0, intermediate: 1, advanced: 2 };
const STUDY_TYPES = new Set(["lesson", "quiz", "review", "assignment", "note"]);

// ---------- 진도 기본 계산 (store와 같은 규칙) ----------

export function courseProgressOf(state: UserState, courseId: string): number {
  const course = getCourse(courseId);
  if (!course) return 0;
  const lessons = courseLessons(course);
  if (lessons.length === 0) return 0;
  const done = lessons.filter((l) => state.lessonProgress[l.id] === "completed").length;
  return Math.round((done / lessons.length) * 100);
}

export function nextLessonOf(state: UserState, course: Course): Lesson | null {
  return courseLessons(course).find((l) => state.lessonProgress[l.id] !== "completed") ?? null;
}

/** 가장 최근에 공부한, 아직 끝나지 않은 강의 */
export function currentCourseOf(state: UserState): Course | null {
  const active = state.enrollments
    .filter((e) => courseProgressOf(state, e.courseId) < 100)
    .sort((a, b) => (b.lastStudiedAt ?? "").localeCompare(a.lastStudiedAt ?? ""));
  return active.length > 0 ? getCourse(active[0].courseId) ?? null : null;
}

const lessonMinutesBetween = (activity: Activity[], from: Date, to: Date) => {
  const lo = dayKey(from);
  const hi = dayKey(to);
  return activity
    .filter((a) => a.type === "lesson")
    .filter((a) => {
      const k = dayKey(new Date(a.at));
      return k >= lo && k <= hi;
    })
    .reduce((sum, a) => sum + (a.minutes ?? 0), 0);
};

const daysAgo = (now: Date, n: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return d;
};

export function studiedOn(activity: Activity[], day: Date): boolean {
  const key = dayKey(day);
  return activity.some((a) => STUDY_TYPES.has(a.type) && dayKey(new Date(a.at)) === key);
}

// ---------- 주간 비교 ----------

export interface WeekComparison {
  thisWeek: number; // 오늘 포함 최근 7일(분)
  lastWeek: number; // 그 이전 7일(분)
  /** 지난주에 레슨 기록이 하나라도 있어야 비교한다 */
  hasLastWeek: boolean;
  diff: number;
}

export function compareWeeks(activity: Activity[], now: Date = new Date()): WeekComparison {
  const thisWeek = lessonMinutesBetween(activity, daysAgo(now, 6), now);
  const lastWeek = lessonMinutesBetween(activity, daysAgo(now, 13), daysAgo(now, 7));
  return { thisWeek, lastWeek, hasLastWeek: lastWeek > 0, diff: thisWeek - lastWeek };
}

/** 최근 7일 중 가장 많이 공부한 날. 기록이 없으면 null */
export function bestDay(days: DayMinutes[]): DayMinutes | null {
  const best = days.reduce<DayMinutes | null>(
    (acc, d) => (d.minutes > 0 && (!acc || d.minutes > acc.minutes) ? d : acc),
    null
  );
  return best;
}

// ---------- 강의별 완주 예상 ----------

export interface CoursePace {
  course: Course;
  progress: number;
  remainingLessons: number;
  remainingMinutes: number;
  /** 최근 14일 동안 이 강의에서 끝낸 레슨 수 */
  recentLessons: number;
  /** 지금 속도로 완주까지 걸릴 일수. 최근 기록이 없으면 예측하지 않는다(null) */
  etaDays: number | null;
}

export function coursePace(state: UserState, course: Course, now: Date = new Date()): CoursePace {
  const lessons = courseLessons(course);
  const remaining = lessons.filter((l) => state.lessonProgress[l.id] !== "completed");
  const from = dayKey(daysAgo(now, 13));
  const recentLessons = state.activity.filter(
    (a) => a.type === "lesson" && a.courseId === course.id && dayKey(new Date(a.at)) >= from
  ).length;
  const perDay = recentLessons / 14;
  return {
    course,
    progress: courseProgressOf(state, course.id),
    remainingLessons: remaining.length,
    remainingMinutes: remaining.reduce((s, l) => s + l.durationMin, 0),
    recentLessons,
    etaDays: remaining.length === 0 ? 0 : perDay > 0 ? Math.ceil(remaining.length / perDay) : null,
  };
}

// ---------- 잘하고 있는 주제 ----------

/**
 * 퀴즈마다 가장 최근의 전체 풀이에서 해당 주제 문항을 모두 맞혔고,
 * 지금 틀려 있는 문항도 없는 주제. 풀어본 적이 없으면 강점으로 치지 않는다.
 */
export function strongTopics(state: UserState, limit = 4): string[] {
  const weakTopics = new Set(computeWeakQuestions(state.quizResults).map((w) => w.topic));
  const out: string[] = [];
  for (const quiz of QUIZZES) {
    const latest = state.quizResults
      .filter((r) => r.quizId === quiz.id && r.mode === "full")
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    if (!latest) continue;
    const byTopic = new Map<string, boolean>();
    latest.questionIds.forEach((qid, i) => {
      const q = quiz.questions.find((x) => x.id === qid);
      if (!q) return;
      const ok = latest.answers[i] === q.answerIndex;
      byTopic.set(q.topic, (byTopic.get(q.topic) ?? true) && ok);
    });
    for (const [topic, ok] of Array.from(byTopic.entries())) {
      if (ok && !weakTopics.has(topic) && !out.includes(topic)) out.push(topic);
    }
  }
  return out.slice(0, limit);
}

// ---------- 오늘의 학습 플랜 ----------

export type PlanKind = "lesson" | "review" | "quiz" | "assignment" | "note";

export interface PlanItem {
  id: PlanKind;
  title: string;
  detail: string;
  href: string;
  done: boolean;
  /** 완료했다면 언제(ISO) — 화면에서 "14:58 완료"로 보여준다 */
  doneAt?: string;
}

/**
 * 오늘 할 일 3가지. 고정된 체크리스트가 아니라 지금 상태에서 가장 효과가 큰 것을 고른다.
 *  1) 이어서 들을 레슨  2) 틀린 문제 복습(없으면 퀴즈)  3) 3일 안에 마감인 과제(없으면 메모)
 * 오늘 이미 한 일은 그 기록으로 '완료' 표시된다.
 */
export function planToday(state: UserState, now: Date = new Date()): PlanItem[] {
  const today = dayKey(now);
  const todays = state.activity.filter((a) => dayKey(new Date(a.at)) === today);
  const doneOf = (types: string[]) => todays.find((a) => types.includes(a.type));
  const items: PlanItem[] = [];

  // 1. 레슨
  const lessonAct = doneOf(["lesson"]);
  const current = currentCourseOf(state);
  const next = current ? nextLessonOf(state, current) : null;
  if (lessonAct) {
    items.push({
      id: "lesson",
      title: lessonAct.label,
      detail: `레슨 완료 · ${lessonAct.minutes ?? 0}분`,
      href: lessonAct.courseId ? `/learn/${lessonAct.courseId}?lesson=${lessonAct.lessonId}` : "/my-learning",
      done: true,
      doneAt: lessonAct.at,
    });
  } else if (current && next) {
    items.push({
      id: "lesson",
      title: next.title,
      detail: `${current.title} · ${next.durationMin}분`,
      href: `/learn/${current.id}?lesson=${next.id}`,
      done: false,
    });
  } else {
    items.push({
      id: "lesson",
      title: "새 강의 시작하기",
      detail: "수강 중인 강의를 모두 마쳤어요",
      href: "/courses",
      done: false,
    });
  }

  // 2. 복습 → 없으면 퀴즈
  const quizAct = doneOf(["review", "quiz"]);
  const weak = groupWeak(computeWeakQuestions(state.quizResults))[0];
  if (quizAct) {
    items.push({
      id: quizAct.type === "review" ? "review" : "quiz",
      title: quizAct.label,
      detail: `${quizAct.type === "review" ? "오답 복습" : "퀴즈"} · ${quizAct.score ?? 0}점`,
      href: quizAct.quizId ? `/quiz/${quizAct.quizId}` : "/quiz",
      done: true,
      doneAt: quizAct.at,
    });
  } else if (weak) {
    items.push({
      id: "review",
      title: `틀린 문제 ${weak.count}개 다시 풀기`,
      detail: `${weak.quiz.title} · ${weak.topics.join(", ")}`,
      href: `/quiz/${weak.quiz.id}?mode=review`,
      done: false,
    });
  } else {
    const enrolled = new Set(state.enrollments.map((e) => e.courseId));
    const quiz =
      QUIZZES.find((q) => enrolled.has(q.courseId) && !state.quizResults.some((r) => r.quizId === q.id)) ??
      QUIZZES.find((q) => enrolled.has(q.courseId));
    if (quiz) {
      items.push({
        id: "quiz",
        title: quiz.title,
        detail: `배운 내용 점검 · ${quiz.questions.length}문항`,
        href: `/quiz/${quiz.id}`,
        done: false,
      });
    }
  }

  // 3. 급한 과제 → 없으면 메모
  const assignAct = doneOf(["assignment"]);
  const urgent = pendingAssignments(state, now).find((u) => u.dLeft <= 3);
  if (assignAct) {
    items.push({
      id: "assignment",
      title: assignAct.label,
      detail: "과제 제출 완료",
      href: `/quiz?tab=assignment#${assignAct.assignmentId ?? ""}`,
      done: true,
      doneAt: assignAct.at,
    });
  } else if (urgent) {
    items.push({
      id: "assignment",
      title: urgent.assignment.title,
      detail: `${dueLabel(urgent.dLeft)} · ${getCourse(urgent.assignment.courseId)?.title ?? ""}`,
      href: `/quiz?tab=assignment#${urgent.assignment.id}`,
      done: false,
    });
  } else {
    const noteAct = doneOf(["note"]);
    items.push({
      id: "note",
      title: noteAct ? noteAct.label : "오늘 배운 내용 한 줄 메모",
      detail: noteAct ? "노트 작성 완료" : "기억에 오래 남기는 가장 쉬운 방법",
      href: "/notes",
      done: Boolean(noteAct),
      doneAt: noteAct?.at,
    });
  }

  return items;
}

// ---------- 과제 ----------

export interface PendingAssignment {
  assignment: (typeof ASSIGNMENTS)[number];
  due: string;
  dLeft: number;
}

/** 수강 중인 강의의 미제출 과제, 마감 순 */
export function pendingAssignments(state: UserState, now: Date = new Date()): PendingAssignment[] {
  return ASSIGNMENTS.filter(
    (a) =>
      (state.assignments[a.id]?.status ?? "pending") === "pending" &&
      state.enrollments.some((e) => e.courseId === a.courseId)
  )
    .map((a) => {
      const due = state.assignmentDue[a.id] ?? dayKey(now);
      return { assignment: a, due, dLeft: daysUntil(due, now) };
    })
    .sort((a, b) => a.due.localeCompare(b.due));
}

// ---------- 멈춘 강의 ----------

export interface StalledCourse {
  course: Course;
  progress: number;
  idleDays: number;
  next: Lesson | null;
}

/** 다 듣지 않았는데 minIdle일 이상 손대지 않은 강의, 오래 멈춘 순 */
export function stalledCourses(state: UserState, now: Date = new Date(), minIdle = 7): StalledCourse[] {
  const out: StalledCourse[] = [];
  for (const e of state.enrollments) {
    const course = getCourse(e.courseId);
    if (!course) continue;
    const progress = courseProgressOf(state, course.id);
    if (progress >= 100) continue;
    const since = e.lastStudiedAt ?? e.enrolledAt;
    const idleDays = -daysUntil(dayKey(new Date(since)), now);
    if (idleDays >= minIdle) out.push({ course, progress, idleDays, next: nextLessonOf(state, course) });
  }
  return out.sort((a, b) => b.idleDays - a.idleDays);
}

// ---------- 잘하고 있는 점 (리포트) ----------

export interface Highlight {
  id: string;
  title: string;
  detail: string;
}

/**
 * 기록에서 확인되는 것만 칭찬한다. 근거가 없으면 빈 배열 — 화면은 빈 상태를 보여준다.
 */
export function strengths(state: UserState, now: Date = new Date(), limit = 3): Highlight[] {
  const out: Highlight[] = [];
  const weekly = computeLast7(state.activity, now).reduce((s, d) => s + d.minutes, 0);
  const wc = compareWeeks(state.activity, now);
  const from = dayKey(daysAgo(now, 6));
  const inWeek = (iso: string) => dayKey(new Date(iso)) >= from;

  if (weekly >= WEEKLY_GOAL_MIN) {
    out.push({ id: "goal", title: "이번 주 목표 달성", detail: `${formatMinutes(weekly)} 공부했어요` });
  }
  if (wc.hasLastWeek && wc.diff > 0) {
    out.push({
      id: "more",
      title: `지난주보다 ${formatMinutes(wc.diff)} 더 공부했어요`,
      detail: `${formatMinutes(wc.lastWeek)} → ${formatMinutes(wc.thisWeek)}`,
    });
  }
  const streak = computeStreak(state.activity, now);
  if (streak >= 3) {
    out.push({ id: "streak", title: `${streak}일 연속 학습`, detail: "하루도 빠지지 않고 기록이 이어지고 있어요" });
  }
  const fixed = state.quizResults
    .filter((r) => r.mode === "review" && inWeek(r.date))
    .reduce((s, r) => s + r.correct, 0);
  if (fixed > 0) {
    out.push({ id: "fixed", title: `틀린 문제 ${fixed}개를 복습으로 바로잡았어요`, detail: "맞힌 문제는 취약 영역에서 빠졌어요" });
  }
  const strong = strongTopics(state, 3);
  if (strong.length > 0) {
    out.push({ id: "strong", title: "퀴즈에서 모두 맞힌 주제", detail: strong.join(", ") });
  }
  const submitted = state.activity.filter((a) => a.type === "assignment" && inWeek(a.at)).length;
  if (submitted > 0) {
    out.push({ id: "assignment", title: `과제 ${submitted}개 제출`, detail: "제출한 과제는 학습 기록에 남아요" });
  }
  return out.slice(0, limit);
}

// ---------- 학습 이정표 (리포트) ----------

export interface MilestoneStatus {
  id: string;
  done: boolean;
  /** 달성했다면 언제(활동 로그에 남은 경우) */
  at?: string;
  /** 아직이라면 지금 어디쯤인지 */
  progress?: string;
}

export function milestoneStatus(state: UserState, now: Date = new Date()): MilestoneStatus[] {
  const streak = computeStreak(state.activity, now);
  const weekly = computeLast7(state.activity, now).reduce((s, d) => s + d.minutes, 0);
  const best = state.quizResults
    .filter((r) => r.mode === "full")
    .reduce<number | null>((m, r) => (m === null || r.score > m ? r.score : m), null);
  const weak = computeWeakQuestions(state.quizResults).length;
  const closest = state.enrollments
    .map((e) => getCourse(e.courseId))
    .filter((c): c is Course => Boolean(c))
    .map((c) => courseLessons(c).filter((l) => state.lessonProgress[l.id] !== "completed").length)
    .filter((n) => n > 0)
    .sort((a, b) => a - b)[0];

  const progressOf: Record<string, string | undefined> = {
    "first-lesson": "레슨 하나를 끝까지 들으면 달성",
    "first-course": closest ? `가장 가까운 강의까지 레슨 ${closest}개` : "강의 하나를 끝까지 들으면 달성",
    "streak-3": `지금 ${streak}일째`,
    "streak-7": `지금 ${streak}일째`,
    "quiz-100": best === null ? "아직 푼 퀴즈가 없어요" : `최고 ${best}점`,
    "weekly-goal": `${formatMinutes(weekly)} / ${formatMinutes(WEEKLY_GOAL_MIN)}`,
    "weak-cleared": weak > 0 ? `틀린 문제 ${weak}개 남음` : "틀린 문제를 복습으로 고치면 달성",
  };
  const unlockedAt = new Map(
    state.activity
      .filter((a) => a.type === "achievement" && a.achievementId)
      .map((a) => [a.achievementId as string, a.at])
  );
  return Object.keys(progressOf).map((id) => {
    const done = state.unlockedAchievements.includes(id);
    return done ? { id, done, at: unlockedAt.get(id) } : { id, done, progress: progressOf[id] };
  });
}

// ---------- 이번 주 추천 행동 (리포트) ----------

export interface CoachAction {
  id: string;
  title: string;
  reason: string;
  href: string;
  cta: string;
  urgent?: boolean;
}

export function weeklyActions(state: UserState, now: Date = new Date(), limit = 3): CoachAction[] {
  const out: CoachAction[] = [];

  const due = pendingAssignments(state, now).filter((u) => u.dLeft <= 2);
  due.forEach((u, i) => {
    out.push({
      id: `assign-${u.assignment.id}`,
      title: `‘${u.assignment.title}’ 제출`,
      reason:
        u.dLeft < 0
          ? "마감이 지났어요. 늦더라도 제출해 두세요"
          : `${dueLabel(u.dLeft)} — ${i === 0 ? "가장 먼저 끝낼 일이에요" : "이어서 끝내 두면 마음이 편해요"}`,
      href: `/quiz?tab=assignment#${u.assignment.id}`,
      cta: "과제 쓰기",
      urgent: true,
    });
  });

  const weak = groupWeak(computeWeakQuestions(state.quizResults));
  if (weak.length > 0) {
    const total = weak.reduce((s, g) => s + g.count, 0);
    out.push({
      id: "weak",
      title: `틀린 문제 ${total}개 다시 풀기`,
      reason: `${weak[0].topics.join(", ")}에서 자주 틀렸어요. 맞히면 취약 영역에서 사라져요`,
      href: `/quiz/${weak[0].quiz.id}?mode=review`,
      cta: "복습하기",
    });
  }

  const weekly = computeLast7(state.activity, now).reduce((s, d) => s + d.minutes, 0);
  const left = WEEKLY_GOAL_MIN - weekly;
  const current = currentCourseOf(state);
  const next = current ? nextLessonOf(state, current) : null;
  if (left > 0 && current && next) {
    out.push({
      id: "weekly",
      title: `‘${next.title}’ 듣기`,
      reason:
        next.durationMin >= left
          ? `이 레슨(${next.durationMin}분) 하나면 이번 주 목표를 채워요`
          : `이번 주 목표까지 ${left}분 — 이 레슨으로 ${left - next.durationMin}분까지 줄어요`,
      href: `/learn/${current.id}?lesson=${next.id}`,
      cta: "이어서 듣기",
    });
  }

  for (const e of state.enrollments) {
    const course = getCourse(e.courseId);
    if (!course) continue;
    const pace = coursePace(state, course, now);
    if (pace.remainingLessons > 0 && pace.remainingLessons <= 2 && course.id !== current?.id) {
      const n = nextLessonOf(state, course)!;
      out.push({
        id: `finish-${course.id}`,
        title: `‘${course.title}’ 완주`,
        reason: `레슨 ${pace.remainingLessons}개(${pace.remainingMinutes}분)만 남았어요`,
        href: `/learn/${course.id}?lesson=${n.id}`,
        cta: "마저 듣기",
      });
    }
  }

  for (const s of stalledCourses(state, now)) {
    if (!s.next) continue;
    out.push({
      id: `resume-${s.course.id}`,
      title: `‘${s.course.title}’ 다시 시작`,
      reason: `${s.idleDays}일째 멈춰 있어요. 다음 레슨은 ${s.next.durationMin}분이면 끝나요`,
      href: `/learn/${s.course.id}?lesson=${s.next.id}`,
      cta: "다시 듣기",
    });
  }

  return out.slice(0, limit);
}

// ---------- 강의 상세: 학습 기간 예상 · 다음 단계 ----------

export const DEFAULT_DAILY_MIN = 30;

export interface StudyEstimate {
  /** 남은(수강 전이면 전체) 학습 시간(분) */
  minutes: number;
  /** 하루 30분 기준 일수 */
  days: number;
  /** 최근 7일 하루 평균(분). 기록이 없으면 null — 페이스를 지어내지 않는다 */
  myDailyMin: number | null;
  /** 내 페이스 기준 일수 */
  myDays: number | null;
}

export function studyEstimate(state: UserState, course: Course, now: Date = new Date()): StudyEstimate {
  const minutes = courseLessons(course)
    .filter((l) => state.lessonProgress[l.id] !== "completed")
    .reduce((s, l) => s + l.durationMin, 0);
  const weekly = computeLast7(state.activity, now).reduce((s, d) => s + d.minutes, 0);
  const myDailyMin = weekly > 0 ? Math.max(1, Math.round(weekly / 7)) : null;
  return {
    minutes,
    days: Math.ceil(minutes / DEFAULT_DAILY_MIN),
    myDailyMin,
    myDays: myDailyMin ? Math.ceil(minutes / myDailyMin) : null,
  };
}

/** 이 강의를 끝낸 뒤 이어 들으면 좋은 강의 — 같은 분야의 다음 난이도, 없으면 같은 강사의 다른 강의 */
export function nextStepCourse(course: Course): Recommendation | null {
  const step = COURSES.filter(
    (c) => c.categoryId === course.categoryId && LEVEL_RANK[c.level] > LEVEL_RANK[course.level]
  ).sort((a, b) => b.rating - a.rating)[0];
  if (step) return { course: step, reason: `${getCategory(step.categoryId)?.name ?? ""} 다음 단계` };
  const same = COURSES.filter((c) => c.categoryId === course.categoryId && c.id !== course.id).sort(
    (a, b) => b.rating - a.rating
  )[0];
  if (same) return { course: same, reason: `함께 들으면 좋은 ${getCategory(same.categoryId)?.name ?? ""} 강의` };
  return null;
}

// ---------- 추천 강의 (이유와 함께) ----------

export interface Recommendation {
  course: Course;
  reason: string;
}

/**
 * 1) 듣고 있거나 끝낸 강의와 같은 분야의 다음 단계(난이도 ↑)
 * 2) 관심분야
 * 3) 그 외 평점 높은 강의
 */
export function recommendCourses(state: UserState, limit = 3): Recommendation[] {
  const enrolled = new Set(state.enrollments.map((e) => e.courseId));
  const candidates = COURSES.filter((c) => !enrolled.has(c.id));
  const taken = state.enrollments
    .map((e) => getCourse(e.courseId))
    .filter((c): c is Course => Boolean(c))
    .sort((a, b) => courseProgressOf(state, b.id) - courseProgressOf(state, a.id));

  const picked: Recommendation[] = [];
  const add = (course: Course, reason: string) => {
    if (picked.length < limit && !picked.some((p) => p.course.id === course.id)) {
      picked.push({ course, reason });
    }
  };

  for (const base of taken) {
    const step = candidates
      .filter((c) => c.categoryId === base.categoryId && LEVEL_RANK[c.level] > LEVEL_RANK[base.level])
      .sort((a, b) => b.rating - a.rating)[0];
    if (step) add(step, `다음 단계 · ${base.title}`);
  }
  for (const c of candidates
    .filter((c) => state.interests.includes(c.categoryId))
    .sort((a, b) => b.rating - a.rating)) {
    add(c, `관심분야 · ${getCategory(c.categoryId)?.name ?? ""}`);
  }
  for (const c of [...candidates].sort((a, b) => b.rating - a.rating)) {
    add(c, `평점 ${c.rating.toFixed(1)} · ${c.studentCount.toLocaleString()}명 수강`);
  }
  return picked;
}
