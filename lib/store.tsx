"use client";

// EduPlaza 로컬 데이터 레이어.
// Supabase 테이블 구조(enrollments / lesson_progress / quiz_results / notes /
// favorites ...)와 동일한 형태를 localStorage에 영속화한다.
//
// 제품 루프의 핵심은 activity(활동 로그)다. 레슨 완료·퀴즈·과제·노트는 모두
// 여기에 한 줄씩 남고, 연속 학습일 / 최근 7일 학습시간 / 오늘의 목표 /
// 캘린더 / 최근 학습 기록은 저장된 숫자가 아니라 이 로그에서 계산된다.
// 그래서 행동 하나가 홈·내 학습·캘린더·리포트에 동시에 반영된다.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ASSIGNMENTS, COURSES, QUIZZES, courseLessons, getCourse, getLesson } from "./data";
import type {
  Activity,
  Assignment,
  AssignmentStatus,
  Course,
  Lesson,
  LessonStatus,
  Note,
  QuizResult,
  UserState,
} from "./types";

export const STORAGE_KEY = "eduplaza-state-v3";

export const WEEKLY_GOAL_MIN = 300; // 최근 7일 기준 5시간
const STUDY_TYPES = new Set(["lesson", "quiz", "review", "assignment", "note"]);
const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

// ---------- 날짜 헬퍼 ----------

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function daysAgo(n: number, hour = 21, minute = 10): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d;
}

/** 오늘 기준 남은 일수. 오늘 마감이면 0, 지났으면 음수. */
export function daysUntil(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  const due = new Date(y, m - 1, d).getTime();
  const t = new Date();
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

function computeStreak(activity: Activity[]): number {
  const days = new Set(
    activity.filter((a) => STUDY_TYPES.has(a.type)).map((a) => dayKey(new Date(a.at)))
  );
  const cursor = new Date();
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

function computeLast7(activity: Activity[]): DayMinutes[] {
  const out: DayMinutes[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
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
function computeWeakQuestions(results: QuizResult[]): WeakQuestion[] {
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

export interface AchievementDef {
  id: string;
  label: string;
  description: string;
  emoji: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first-lesson", label: "첫 발걸음", description: "첫 레슨 완료", emoji: "🌱" },
  { id: "first-course", label: "첫 완주", description: "첫 강의 완료", emoji: "🎓" },
  { id: "streak-3", label: "꾸준함의 시작", description: "3일 연속 학습", emoji: "🔥" },
  { id: "streak-7", label: "일주일의 힘", description: "7일 연속 학습", emoji: "💪" },
  { id: "quiz-100", label: "퍼펙트 스코어", description: "퀴즈 100점 달성", emoji: "🏆" },
  { id: "weekly-goal", label: "주간 목표 달성", description: "최근 7일 5시간 학습", emoji: "⭐" },
];

/** 상태를 보고 새로 달성한 성취를 해금하고, 해금 자체도 활동 로그에 남긴다. */
function applyAchievements(s: UserState): UserState {
  const has = new Set(s.unlockedAchievements);
  const earned: string[] = [];
  const check = (id: string, ok: boolean) => {
    if (ok && !has.has(id)) earned.push(id);
  };
  const completed = Object.values(s.lessonProgress).filter((v) => v === "completed").length;
  const streak = computeStreak(s.activity);
  const weekly = computeLast7(s.activity).reduce((a, d) => a + d.minutes, 0);
  const anyCourseDone = s.enrollments.some((e) => {
    const c = getCourse(e.courseId);
    return c ? courseLessons(c).every((l) => s.lessonProgress[l.id] === "completed") : false;
  });

  check("first-lesson", completed > 0);
  check("first-course", anyCourseDone);
  check("streak-3", streak >= 3);
  check("streak-7", streak >= 7);
  check("quiz-100", s.quizResults.some((r) => r.mode === "full" && r.score === 100));
  check("weekly-goal", weekly >= WEEKLY_GOAL_MIN);
  if (earned.length === 0) return s;

  const now = new Date().toISOString();
  const logs: Activity[] = earned.map((id, i) => ({
    id: `act-ach-${Date.now()}-${i}`,
    type: "achievement",
    at: now,
    achievementId: id,
    label: ACHIEVEMENTS.find((a) => a.id === id)?.label ?? id,
  }));
  return {
    ...s,
    unlockedAchievements: [...s.unlockedAchievements, ...earned],
    activity: [...logs, ...s.activity],
  };
}

// ---------- 시드 (첫 방문 데모 유저) ----------

function seedState(): UserState {
  const lessonProgress: Record<string, LessonStatus> = {};
  const complete = (courseId: string, count: number) => {
    const lessons = courseLessons(getCourse(courseId)!);
    lessons.slice(0, count).forEach((l) => (lessonProgress[l.id] = "completed"));
    if (count < lessons.length && count > 0) {
      lessonProgress[lessons[count].id] = "in_progress";
    }
  };
  complete("c1", 8); // 12개 중 8개 → 67%
  complete("c2", 3);
  complete("c3", 2);
  complete("c9", 4);
  complete("c11", 6); // 완료
  complete("c6", 6); // 완료

  const iso = (n: number, hour = 21, minute = 10) => daysAgo(n, hour, minute).toISOString();

  // 1~12일 전까지 매일 학습 → 연속 12일. 오늘은 비워 두어 첫 행동이 바로 반영되게 한다.
  // 최근 7일(1~6일 전) 합계 275분 → 주간 목표까지 25분.
  const plan: Record<number, string[]> = {
    1: ["c1-s3-l2", "c1-s3-l1", "c9-s2-l1"],
    2: ["c1-s2-l3", "c2-s2-l1", "c9-s1-l3"],
    3: ["c1-s2-l2", "c3-s1-l2", "c2-s1-l2"],
    4: ["c1-s2-l1", "c9-s1-l2", "c3-s1-l1", "c2-s1-l1"],
    5: ["c1-s1-l3", "c9-s1-l1", "c11-s2-l2"],
    6: ["c1-s1-l1", "c11-s2-l1", "c11-s1-l3"],
    7: ["c11-s1-l2", "c11-s1-l1"],
    8: ["c6-s2-l3", "c6-s2-l2"],
    9: ["c6-s2-l1", "c11-s2-l3"],
    10: ["c6-s1-l3", "c6-s1-l2"],
    11: ["c6-s1-l1"],
    12: ["c1-s1-l2"],
  };
  const activity: Activity[] = [];
  for (const [n, ids] of Object.entries(plan)) {
    ids.forEach((lessonId, i) => {
      const found = getLesson(lessonId)!;
      activity.push({
        id: `seed-l-${lessonId}`,
        type: "lesson",
        at: iso(Number(n), 20, 10 + i * 20),
        label: found.lesson.title,
        minutes: found.lesson.durationMin,
        courseId: found.course.id,
        lessonId,
      });
    });
  }

  // 기존 퀴즈 기록 — 문항별 답안까지 저장해 취약 주제를 만든다.
  const q1 = QUIZZES.find((q) => q.id === "q1")!;
  const q2 = QUIZZES.find((q) => q.id === "q2")!;
  const answersWith = (quiz: typeof q1, wrong: Record<string, number>) =>
    quiz.questions.map((q) => (q.id in wrong ? wrong[q.id] : q.answerIndex));
  const quizResults: QuizResult[] = [
    {
      id: "qr1",
      quizId: "q2",
      mode: "full",
      score: 86,
      correct: 6,
      total: 7,
      questionIds: q2.questions.map((q) => q.id),
      answers: answersWith(q2, { "q2-2": 0 }),
      date: iso(5, 21, 40),
    },
    {
      id: "qr2",
      quizId: "q1",
      mode: "full",
      score: 71,
      correct: 5,
      total: 7,
      questionIds: q1.questions.map((q) => q.id),
      answers: answersWith(q1, { "q1-4": 0, "q1-7": 1 }),
      date: iso(9, 21, 40),
    },
  ];
  activity.push(
    { id: "seed-q-qr1", type: "quiz", at: quizResults[0].date, label: q2.title, quizId: "q2", score: 86 },
    { id: "seed-q-qr2", type: "quiz", at: quizResults[1].date, label: q1.title, quizId: "q1", score: 71 },
    { id: "seed-a-a3", type: "assignment", at: iso(3, 22), label: "업무 프롬프트 템플릿 만들기", assignmentId: "a3", courseId: "c2" },
    { id: "seed-n-n1", type: "note", at: iso(2, 21, 50), label: "EDA 체크리스트", courseId: "c1", lessonId: "c1-s3-l3" },
    { id: "seed-n-n2", type: "note", at: iso(4, 21, 50), label: "JOIN 정리", courseId: "c9", lessonId: "c9-s2-l2" }
  );
  activity.sort((a, b) => b.at.localeCompare(a.at));

  const assignmentDue: Record<string, string> = {};
  ASSIGNMENTS.forEach((a) => {
    const d = new Date();
    d.setDate(d.getDate() + a.dueInDays);
    assignmentDue[a.id] = dayKey(d);
  });

  return {
    name: "김팀장",
    interests: ["data", "ai", "design"],
    enrollments: [
      { courseId: "c1", enrolledAt: iso(30), lastLessonId: "c1-s3-l3", lastStudiedAt: iso(1, 20, 50) },
      { courseId: "c9", enrolledAt: iso(14), lastLessonId: "c9-s2-l2", lastStudiedAt: iso(1, 20, 30) },
      { courseId: "c2", enrolledAt: iso(20), lastLessonId: "c2-s2-l2", lastStudiedAt: iso(2) },
      { courseId: "c3", enrolledAt: iso(10), lastLessonId: "c3-s1-l3", lastStudiedAt: iso(3) },
      { courseId: "c11", enrolledAt: iso(45), lastLessonId: "c11-s2-l3", lastStudiedAt: iso(9) },
      { courseId: "c6", enrolledAt: iso(60), lastLessonId: "c6-s2-l3", lastStudiedAt: iso(8) },
    ],
    lessonProgress,
    quizResults,
    notes: [
      {
        id: "n1",
        courseId: "c1",
        lessonId: "c1-s3-l3",
        content:
          "EDA 체크리스트: ① 데이터 크기와 타입 확인 ② 결측치 비율 확인 ③ 수치형 분포 확인(히스토그램) ④ 범주형 빈도 확인 ⑤ 변수 간 상관관계. 실무에서는 결측치 처리 기준을 팀과 먼저 합의할 것!",
        createdAt: iso(2, 21, 50),
        updatedAt: iso(2, 21, 50),
      },
      {
        id: "n2",
        courseId: "c9",
        lessonId: "c9-s2-l2",
        content:
          "JOIN 정리 — INNER: 양쪽 모두 있는 것만 / LEFT: 왼쪽 기준 전부 + 오른쪽 매칭. 실무에서는 LEFT JOIN 후 NULL 체크하는 패턴을 자주 사용한다.",
        createdAt: iso(4, 21, 50),
        updatedAt: iso(4, 21, 50),
      },
    ],
    favorites: ["c13", "c14", "c18"],
    assignments: {
      a3: {
        status: "submitted",
        text: "주간 업무 보고 프롬프트 템플릿을 작성했습니다. 역할(팀 리더 보고용), 입력(이번 주 완료 업무 목록), 출력 형식(성과/이슈/다음 주 계획 3단 구성)을 지정해 재사용 가능하게 만들었습니다.",
        submittedAt: iso(3, 22),
      },
    },
    assignmentDue,
    activity,
    unlockedAchievements: ["first-lesson", "first-course", "streak-3", "streak-7"],
  };
}

// ---------- API ----------

export interface TodayGoal {
  id: "lesson" | "quiz" | "note";
  label: string;
  done: boolean;
}

export interface UpcomingAssignment {
  assignment: Assignment;
  due: string;
  dLeft: number;
}

interface StoreApi {
  ready: boolean;
  state: UserState;
  // 파생값 — 활동 로그에서 계산
  streak: number;
  last7: DayMinutes[];
  weeklyTotal: number;
  todayGoals: TodayGoal[];
  weakQuestions: WeakQuestion[];
  upcomingAssignments: UpcomingAssignment[];
  // enrollment
  isEnrolled: (courseId: string) => boolean;
  enroll: (courseId: string) => void;
  // progress
  lessonStatus: (lessonId: string) => LessonStatus;
  courseProgress: (courseId: string) => number; // 0-100
  courseStatus: (courseId: string) => "enrolled" | "in_progress" | "completed";
  nextLesson: (courseId: string) => Lesson | null;
  currentCourse: () => Course | null;
  completeLesson: (courseId: string, lesson: Lesson) => void;
  setLastLesson: (courseId: string, lessonId: string) => void;
  overallProgress: () => number;
  completedCourseCount: () => number;
  completedLessonCount: () => number;
  // quiz
  saveQuizResult: (
    quizId: string,
    mode: "full" | "review",
    questionIds: string[],
    answers: number[]
  ) => QuizResult;
  bestScore: (quizId: string) => number | null;
  // notes
  addNote: (courseId: string, lessonId: string | null, content: string) => void;
  updateNote: (id: string, content: string) => void;
  deleteNote: (id: string) => void;
  // favorites
  isFavorite: (courseId: string) => boolean;
  toggleFavorite: (courseId: string) => void;
  // assignments
  assignmentStatus: (id: string) => AssignmentStatus;
  assignmentDue: (id: string) => string;
  submitAssignment: (id: string, text: string) => void;
}

const StoreContext = createContext<StoreApi | null>(null);

function logId(prefix: string) {
  return `act-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<UserState>(seedState);
  const [ready, setReady] = useState(false);
  const skipPersist = useRef(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as UserState;
        if (parsed && Array.isArray(parsed.enrollments) && Array.isArray(parsed.activity)) {
          setState(parsed);
        }
      }
    } catch {
      // 손상된 저장 데이터는 무시하고 시드로 시작
    }
    skipPersist.current = false;
    setReady(true);
  }, []);

  useEffect(() => {
    if (skipPersist.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // 저장 실패는 치명적이지 않음
    }
  }, [state]);

  /** 모든 쓰기는 이 경로를 거쳐 성취 판정까지 한 번에 반영된다. */
  const commit = useCallback((fn: (s: UserState) => UserState) => {
    setState((s) => {
      const next = fn(s);
      return next === s ? s : applyAchievements(next);
    });
  }, []);

  // ---- 파생값 ----
  const streak = useMemo(() => computeStreak(state.activity), [state.activity]);
  const last7 = useMemo(() => computeLast7(state.activity), [state.activity]);
  const weeklyTotal = useMemo(() => last7.reduce((a, d) => a + d.minutes, 0), [last7]);
  const weakQuestions = useMemo(
    () => computeWeakQuestions(state.quizResults),
    [state.quizResults]
  );
  const todayGoals = useMemo<TodayGoal[]>(() => {
    const today = dayKey(new Date());
    const doneToday = (types: string[]) =>
      state.activity.some((a) => types.includes(a.type) && dayKey(new Date(a.at)) === today);
    return [
      { id: "lesson", label: "레슨 1개 완료하기", done: doneToday(["lesson"]) },
      { id: "quiz", label: "퀴즈 1개 풀기", done: doneToday(["quiz", "review"]) },
      { id: "note", label: "학습노트 남기기", done: doneToday(["note"]) },
    ];
  }, [state.activity]);
  const upcomingAssignments = useMemo<UpcomingAssignment[]>(
    () =>
      ASSIGNMENTS.filter(
        (a) =>
          (state.assignments[a.id]?.status ?? "pending") === "pending" &&
          state.enrollments.some((e) => e.courseId === a.courseId)
      )
        .map((a) => {
          const due = state.assignmentDue[a.id] ?? dayKey(new Date());
          return { assignment: a, due, dLeft: daysUntil(due) };
        })
        .sort((a, b) => a.due.localeCompare(b.due)),
    [state.assignments, state.assignmentDue, state.enrollments]
  );

  // ---- enrollment ----
  const isEnrolled = useCallback(
    (courseId: string) => state.enrollments.some((e) => e.courseId === courseId),
    [state.enrollments]
  );

  const enroll = useCallback(
    (courseId: string) => {
      commit((s) => {
        if (s.enrollments.some((e) => e.courseId === courseId)) return s;
        const now = new Date().toISOString();
        return {
          ...s,
          enrollments: [
            { courseId, enrolledAt: now, lastLessonId: null, lastStudiedAt: null },
            ...s.enrollments,
          ],
          activity: [
            {
              id: logId("enroll"),
              type: "enroll",
              at: now,
              courseId,
              label: getCourse(courseId)?.title ?? "",
            },
            ...s.activity,
          ],
        };
      });
    },
    [commit]
  );

  // ---- progress ----
  const lessonStatus = useCallback(
    (lessonId: string): LessonStatus => state.lessonProgress[lessonId] ?? "not_started",
    [state.lessonProgress]
  );

  const courseProgress = useCallback(
    (courseId: string): number => {
      const course = getCourse(courseId);
      if (!course) return 0;
      const lessons = courseLessons(course);
      if (lessons.length === 0) return 0;
      const done = lessons.filter((l) => state.lessonProgress[l.id] === "completed").length;
      return Math.round((done / lessons.length) * 100);
    },
    [state.lessonProgress]
  );

  const courseStatus = useCallback(
    (courseId: string) => {
      const pct = courseProgress(courseId);
      if (pct >= 100) return "completed" as const;
      if (pct > 0) return "in_progress" as const;
      return "enrolled" as const;
    },
    [courseProgress]
  );

  const nextLesson = useCallback(
    (courseId: string): Lesson | null => {
      const course = getCourse(courseId);
      if (!course) return null;
      return (
        courseLessons(course).find((l) => state.lessonProgress[l.id] !== "completed") ?? null
      );
    },
    [state.lessonProgress]
  );

  const currentCourse = useCallback((): Course | null => {
    const active = state.enrollments
      .filter((e) => courseProgress(e.courseId) < 100)
      .sort((a, b) => (b.lastStudiedAt ?? "").localeCompare(a.lastStudiedAt ?? ""));
    return active.length > 0 ? getCourse(active[0].courseId) ?? null : null;
  }, [state.enrollments, courseProgress]);

  const setLastLesson = useCallback((courseId: string, lessonId: string) => {
    setState((s) => ({
      ...s,
      enrollments: s.enrollments.map((e) =>
        e.courseId === courseId
          ? { ...e, lastLessonId: lessonId, lastStudiedAt: new Date().toISOString() }
          : e
      ),
      lessonProgress:
        s.lessonProgress[lessonId] === "completed"
          ? s.lessonProgress
          : { ...s.lessonProgress, [lessonId]: "in_progress" },
    }));
  }, []);

  const completeLesson = useCallback(
    (courseId: string, lesson: Lesson) => {
      commit((s) => {
        if (s.lessonProgress[lesson.id] === "completed") return s;
        const now = new Date().toISOString();
        return {
          ...s,
          lessonProgress: { ...s.lessonProgress, [lesson.id]: "completed" },
          enrollments: s.enrollments.map((e) =>
            e.courseId === courseId ? { ...e, lastLessonId: lesson.id, lastStudiedAt: now } : e
          ),
          activity: [
            {
              id: logId("lesson"),
              type: "lesson",
              at: now,
              label: lesson.title,
              minutes: lesson.durationMin,
              courseId,
              lessonId: lesson.id,
            },
            ...s.activity,
          ],
        };
      });
    },
    [commit]
  );

  const overallProgress = useCallback((): number => {
    if (state.enrollments.length === 0) return 0;
    const sum = state.enrollments.reduce((acc, e) => acc + courseProgress(e.courseId), 0);
    return Math.round(sum / state.enrollments.length);
  }, [state.enrollments, courseProgress]);

  const completedCourseCount = useCallback(
    () => state.enrollments.filter((e) => courseProgress(e.courseId) >= 100).length,
    [state.enrollments, courseProgress]
  );

  const completedLessonCount = useCallback(
    () => Object.values(state.lessonProgress).filter((v) => v === "completed").length,
    [state.lessonProgress]
  );

  // ---- quiz ----
  const saveQuizResult = useCallback(
    (
      quizId: string,
      mode: "full" | "review",
      questionIds: string[],
      answers: number[]
    ): QuizResult => {
      const quiz = QUIZZES.find((q) => q.id === quizId);
      const correct = questionIds.filter((qid, i) => {
        const q = quiz?.questions.find((x) => x.id === qid);
        return q ? answers[i] === q.answerIndex : false;
      }).length;
      const total = questionIds.length;
      const result: QuizResult = {
        id: `qr-${Date.now()}`,
        quizId,
        mode,
        score: total ? Math.round((correct / total) * 100) : 0,
        correct,
        total,
        questionIds,
        answers,
        date: new Date().toISOString(),
      };
      commit((s) => ({
        ...s,
        quizResults: [result, ...s.quizResults],
        activity: [
          {
            id: logId(mode),
            type: mode === "full" ? "quiz" : "review",
            at: result.date,
            label: quiz?.title ?? "퀴즈",
            quizId,
            courseId: quiz?.courseId,
            score: result.score,
          },
          ...s.activity,
        ],
      }));
      return result;
    },
    [commit]
  );

  const bestScore = useCallback(
    (quizId: string): number | null => {
      const scores = state.quizResults
        .filter((r) => r.quizId === quizId && r.mode === "full")
        .map((r) => r.score);
      return scores.length ? Math.max(...scores) : null;
    },
    [state.quizResults]
  );

  // ---- notes ----
  const addNote = useCallback(
    (courseId: string, lessonId: string | null, content: string) => {
      const now = new Date().toISOString();
      const note: Note = {
        id: `n-${Date.now()}`,
        courseId,
        lessonId,
        content,
        createdAt: now,
        updatedAt: now,
      };
      const lessonTitle = lessonId ? getLesson(lessonId)?.lesson.title : undefined;
      commit((s) => ({
        ...s,
        notes: [note, ...s.notes],
        activity: [
          {
            id: logId("note"),
            type: "note",
            at: now,
            label: lessonTitle ?? getCourse(courseId)?.title ?? "학습노트",
            courseId,
            lessonId: lessonId ?? undefined,
          },
          ...s.activity,
        ],
      }));
    },
    [commit]
  );

  const updateNote = useCallback((id: string, content: string) => {
    setState((s) => ({
      ...s,
      notes: s.notes.map((n) =>
        n.id === id ? { ...n, content, updatedAt: new Date().toISOString() } : n
      ),
    }));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setState((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) }));
  }, []);

  // ---- favorites ----
  const isFavorite = useCallback(
    (courseId: string) => state.favorites.includes(courseId),
    [state.favorites]
  );

  const toggleFavorite = useCallback((courseId: string) => {
    setState((s) => ({
      ...s,
      favorites: s.favorites.includes(courseId)
        ? s.favorites.filter((id) => id !== courseId)
        : [courseId, ...s.favorites],
    }));
  }, []);

  // ---- assignments ----
  const assignmentStatus = useCallback(
    (id: string): AssignmentStatus => state.assignments[id]?.status ?? "pending",
    [state.assignments]
  );

  const assignmentDue = useCallback(
    (id: string): string => state.assignmentDue[id] ?? dayKey(new Date()),
    [state.assignmentDue]
  );

  const submitAssignment = useCallback(
    (id: string, text: string) => {
      const a = ASSIGNMENTS.find((x) => x.id === id);
      const now = new Date().toISOString();
      commit((s) => ({
        ...s,
        assignments: {
          ...s.assignments,
          [id]: { status: "submitted", text, submittedAt: now },
        },
        activity: [
          {
            id: logId("assignment"),
            type: "assignment",
            at: now,
            label: a?.title ?? "과제",
            assignmentId: id,
            courseId: a?.courseId,
          },
          ...s.activity,
        ],
      }));
    },
    [commit]
  );

  const api = useMemo<StoreApi>(
    () => ({
      ready,
      state,
      streak,
      last7,
      weeklyTotal,
      todayGoals,
      weakQuestions,
      upcomingAssignments,
      isEnrolled,
      enroll,
      lessonStatus,
      courseProgress,
      courseStatus,
      nextLesson,
      currentCourse,
      completeLesson,
      setLastLesson,
      overallProgress,
      completedCourseCount,
      completedLessonCount,
      saveQuizResult,
      bestScore,
      addNote,
      updateNote,
      deleteNote,
      isFavorite,
      toggleFavorite,
      assignmentStatus,
      assignmentDue,
      submitAssignment,
    }),
    [
      ready,
      state,
      streak,
      last7,
      weeklyTotal,
      todayGoals,
      weakQuestions,
      upcomingAssignments,
      isEnrolled,
      enroll,
      lessonStatus,
      courseProgress,
      courseStatus,
      nextLesson,
      currentCourse,
      completeLesson,
      setLastLesson,
      overallProgress,
      completedCourseCount,
      completedLessonCount,
      saveQuizResult,
      bestScore,
      addNote,
      updateNote,
      deleteNote,
      isFavorite,
      toggleFavorite,
      assignmentStatus,
      assignmentDue,
      submitAssignment,
    ]
  );

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

// 코스 목록 헬퍼 — 여러 화면에서 반복되던 "수강 중인 코스 객체" 변환을 한 곳에 둔다.
export function enrolledCourses(state: UserState): Course[] {
  return state.enrollments
    .map((e) => COURSES.find((c) => c.id === e.courseId))
    .filter((c): c is Course => Boolean(c));
}
