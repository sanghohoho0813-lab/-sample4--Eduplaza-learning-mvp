"use client";

// EduPlaza 로컬 데이터 레이어.
// Supabase 테이블 구조(enrollments / lesson_progress / quiz_results / notes /
// favorites ...)와 동일한 형태를 localStorage에 영속화한다.
// Demo User(김지현)가 첫 방문 시 자동 시딩되어 시연이 바로 가능하다.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { COURSES, courseLessons, getCourse } from "./data";
import type {
  AssignmentStatus,
  Course,
  Lesson,
  LessonStatus,
  Mission,
  Note,
  QuizResult,
  UserState,
} from "./types";

const STORAGE_KEY = "eduplaza-state-v1";

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
  complete("c2", 3); // 8개 중 3개
  complete("c3", 2); // 8개 중 2개
  complete("c9", 4); // 8개 중 4개
  complete("c11", 6); // 완료
  complete("c6", 6); // 완료

  const now = new Date();
  const iso = (daysAgo: number, hour = 21) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour, 15, 0, 0);
    return d.toISOString();
  };

  return {
    name: "지현",
    interests: ["data", "ai", "design"],
    streakDays: 12,
    weeklyMinutes: [95, 80, 70, 110, 60, 60, 50], // 합계 8시간 45분
    enrollments: [
      { courseId: "c1", enrolledAt: iso(30), lastLessonId: "c1-s3-l3", lastStudiedAt: iso(0, 8) },
      { courseId: "c2", enrolledAt: iso(20), lastLessonId: "c2-s2-l2", lastStudiedAt: iso(1) },
      { courseId: "c9", enrolledAt: iso(14), lastLessonId: "c9-s2-l2", lastStudiedAt: iso(2) },
      { courseId: "c3", enrolledAt: iso(10), lastLessonId: "c3-s1-l3", lastStudiedAt: iso(3) },
      { courseId: "c11", enrolledAt: iso(45), lastLessonId: "c11-s2-l3", lastStudiedAt: iso(6) },
      { courseId: "c6", enrolledAt: iso(60), lastLessonId: "c6-s2-l3", lastStudiedAt: iso(12) },
    ],
    lessonProgress,
    quizResults: [
      { id: "qr1", quizId: "q2", score: 86, correct: 6, total: 7, date: iso(5) },
      { id: "qr2", quizId: "q1", score: 71, correct: 5, total: 7, date: iso(9) },
    ],
    notes: [
      {
        id: "n1",
        courseId: "c1",
        lessonId: "c1-s3-l3",
        content:
          "EDA 체크리스트: ① 데이터 크기와 타입 확인 ② 결측치 비율 확인 ③ 수치형 분포 확인(히스토그램) ④ 범주형 빈도 확인 ⑤ 변수 간 상관관계. 실무에서는 결측치 처리 기준을 팀과 먼저 합의할 것!",
        createdAt: iso(2),
        updatedAt: iso(2),
      },
      {
        id: "n2",
        courseId: "c9",
        lessonId: "c9-s2-l2",
        content:
          "JOIN 정리 — INNER: 양쪽 모두 있는 것만 / LEFT: 왼쪽 기준 전부 + 오른쪽 매칭. 실무에서는 LEFT JOIN 후 NULL 체크하는 패턴을 자주 사용한다.",
        createdAt: iso(4),
        updatedAt: iso(4),
      },
    ],
    favorites: ["c13", "c14", "c18"],
    assignments: {
      a3: {
        status: "submitted",
        text: "주간 업무 보고 프롬프트 템플릿을 작성했습니다. 역할(팀 리더 보고용), 입력(이번 주 완료 업무 목록), 출력 형식(성과/이슈/다음 주 계획 3단 구성)을 지정해 재사용 가능하게 만들었습니다.",
        submittedAt: iso(3),
      },
    },
    missions: [
      { id: "m1", label: "강의 1개 수강하기", done: false },
      { id: "m2", label: "퀴즈 1개 풀기", done: false },
      { id: "m3", label: "학습노트 작성하기", done: false },
    ],
    unlockedAchievements: ["first-lesson", "first-course", "streak-3", "streak-7"],
  };
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
  { id: "weekly-goal", label: "주간 목표 달성", description: "주 5시간 학습 달성", emoji: "⭐" },
];

interface StoreApi {
  ready: boolean;
  state: UserState;
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
  saveQuizResult: (quizId: string, correct: number, total: number) => QuizResult;
  // notes
  addNote: (courseId: string, lessonId: string | null, content: string) => void;
  updateNote: (id: string, content: string) => void;
  deleteNote: (id: string) => void;
  // favorites
  isFavorite: (courseId: string) => boolean;
  toggleFavorite: (courseId: string) => void;
  // assignments
  assignmentStatus: (id: string) => AssignmentStatus;
  submitAssignment: (id: string, text: string) => void;
  // missions
  toggleMission: (id: string) => void;
}

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<UserState>(seedState);
  const [ready, setReady] = useState(false);
  const skipPersist = useRef(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as UserState;
        if (parsed && Array.isArray(parsed.enrollments)) setState(parsed);
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

  const isEnrolled = useCallback(
    (courseId: string) => state.enrollments.some((e) => e.courseId === courseId),
    [state.enrollments]
  );

  const enroll = useCallback((courseId: string) => {
    setState((s) => {
      if (s.enrollments.some((e) => e.courseId === courseId)) return s;
      return {
        ...s,
        enrollments: [
          {
            courseId,
            enrolledAt: new Date().toISOString(),
            lastLessonId: null,
            lastStudiedAt: null,
          },
          ...s.enrollments,
        ],
      };
    });
  }, []);

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
      const done = lessons.filter(
        (l) => state.lessonProgress[l.id] === "completed"
      ).length;
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
      const lessons = courseLessons(course);
      const firstIncomplete = lessons.find(
        (l) => state.lessonProgress[l.id] !== "completed"
      );
      return firstIncomplete ?? null;
    },
    [state.lessonProgress]
  );

  const currentCourse = useCallback((): Course | null => {
    const active = state.enrollments
      .filter((e) => {
        const pct = courseProgress(e.courseId);
        return pct < 100;
      })
      .sort((a, b) =>
        (b.lastStudiedAt ?? "").localeCompare(a.lastStudiedAt ?? "")
      );
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

  const completeLesson = useCallback((courseId: string, lesson: Lesson) => {
    setState((s) => {
      const dayIdx = (new Date().getDay() + 6) % 7; // 월=0
      const weekly = [...s.weeklyMinutes];
      weekly[dayIdx] += lesson.durationMin;

      const missions = s.missions.map((m) =>
        m.id === "m1" ? { ...m, done: true } : m
      );

      const unlocked = new Set(s.unlockedAchievements);
      unlocked.add("first-lesson");
      const weeklyTotal = weekly.reduce((a, b) => a + b, 0);
      if (weeklyTotal >= 300) unlocked.add("weekly-goal");

      // 강의 완료 체크
      const course = getCourse(courseId);
      if (course) {
        const lessons = courseLessons(course);
        const allDone = lessons.every(
          (l) => l.id === lesson.id || s.lessonProgress[l.id] === "completed"
        );
        if (allDone) unlocked.add("first-course");
      }

      return {
        ...s,
        weeklyMinutes: weekly,
        missions,
        unlockedAchievements: Array.from(unlocked),
        lessonProgress: { ...s.lessonProgress, [lesson.id]: "completed" },
        enrollments: s.enrollments.map((e) =>
          e.courseId === courseId
            ? { ...e, lastLessonId: lesson.id, lastStudiedAt: new Date().toISOString() }
            : e
        ),
      };
    });
  }, []);

  const overallProgress = useCallback((): number => {
    if (state.enrollments.length === 0) return 0;
    const sum = state.enrollments.reduce(
      (acc, e) => acc + courseProgress(e.courseId),
      0
    );
    return Math.round(sum / state.enrollments.length);
  }, [state.enrollments, courseProgress]);

  const completedCourseCount = useCallback(
    () =>
      state.enrollments.filter((e) => courseProgress(e.courseId) >= 100).length,
    [state.enrollments, courseProgress]
  );

  const completedLessonCount = useCallback(
    () =>
      Object.values(state.lessonProgress).filter((v) => v === "completed").length,
    [state.lessonProgress]
  );

  const saveQuizResult = useCallback(
    (quizId: string, correct: number, total: number): QuizResult => {
      const score = Math.round((correct / total) * 100);
      const result: QuizResult = {
        id: `qr-${Date.now()}`,
        quizId,
        score,
        correct,
        total,
        date: new Date().toISOString(),
      };
      setState((s) => {
        const unlocked = new Set(s.unlockedAchievements);
        if (score === 100) unlocked.add("quiz-100");
        return {
          ...s,
          quizResults: [result, ...s.quizResults],
          missions: s.missions.map((m) => (m.id === "m2" ? { ...m, done: true } : m)),
          unlockedAchievements: Array.from(unlocked),
        };
      });
      return result;
    },
    []
  );

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
      setState((s) => ({
        ...s,
        notes: [note, ...s.notes],
        missions: s.missions.map((m) => (m.id === "m3" ? { ...m, done: true } : m)),
      }));
    },
    []
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

  const assignmentStatus = useCallback(
    (id: string): AssignmentStatus => state.assignments[id]?.status ?? "pending",
    [state.assignments]
  );

  const submitAssignment = useCallback((id: string, text: string) => {
    setState((s) => ({
      ...s,
      assignments: {
        ...s.assignments,
        [id]: { status: "submitted", text, submittedAt: new Date().toISOString() },
      },
    }));
  }, []);

  const toggleMission = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      missions: s.missions.map((m) => (m.id === id ? { ...m, done: !m.done } : m)),
    }));
  }, []);

  const api = useMemo<StoreApi>(
    () => ({
      ready,
      state,
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
      addNote,
      updateNote,
      deleteNote,
      isFavorite,
      toggleFavorite,
      assignmentStatus,
      submitAssignment,
      toggleMission,
    }),
    [
      ready,
      state,
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
      addNote,
      updateNote,
      deleteNote,
      isFavorite,
      toggleFavorite,
      assignmentStatus,
      submitAssignment,
      toggleMission,
    ]
  );

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
