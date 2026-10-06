// localStorage에서 읽은 값은 "믿지 않는다".
// 손으로 고친 값, 이전 버전 스키마, 지워진 강의 id가 섞여 있어도 앱이 깨지지 않도록
// 모양을 검사하고, 빠진 필드는 기본값으로 채우고, 쓸 수 없는 항목은 버린다.

import { getCourse, getLesson } from "./data";
import type {
  Activity,
  ActivityType,
  AssignmentSubmission,
  CategoryId,
  Enrollment,
  LessonStatus,
  Note,
  NotificationPrefs,
  QuizResult,
  UserState,
} from "./types";

const ACTIVITY_TYPES: ActivityType[] = [
  "lesson",
  "quiz",
  "review",
  "assignment",
  "note",
  "enroll",
  "achievement",
];
const LESSON_STATUSES: LessonStatus[] = ["not_started", "in_progress", "completed"];

export const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  daily: true,
  assignment: true,
  marketing: false,
};

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string";
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isIsoDate = (v: unknown): v is string => isStr(v) && !Number.isNaN(Date.parse(v));
const list = <T>(v: unknown, keep: (x: unknown) => x is T): T[] =>
  Array.isArray(v) ? v.filter(keep) : [];

const isEnrollment = (x: unknown): x is Enrollment =>
  isObj(x) && isStr(x.courseId) && Boolean(getCourse(x.courseId)) && isIsoDate(x.enrolledAt);

const isQuizResult = (x: unknown): x is QuizResult =>
  isObj(x) &&
  isStr(x.id) &&
  isStr(x.quizId) &&
  (x.mode === "full" || x.mode === "review") &&
  isNum(x.score) &&
  Array.isArray(x.questionIds) &&
  Array.isArray(x.answers) &&
  x.questionIds.length === x.answers.length &&
  isIsoDate(x.date);

const isNote = (x: unknown): x is Note =>
  isObj(x) && isStr(x.id) && isStr(x.courseId) && isStr(x.content) && isIsoDate(x.updatedAt);

const isActivity = (x: unknown): x is Activity =>
  isObj(x) &&
  isStr(x.id) &&
  ACTIVITY_TYPES.includes(x.type as ActivityType) &&
  isIsoDate(x.at) &&
  isStr(x.label);

/**
 * 저장된 값을 현재 스키마의 UserState로 복원한다.
 * 핵심 구조(수강 목록·활동 로그)가 없으면 복원할 수 없다고 보고 null을 돌려준다
 * — 이 경우 호출한 쪽은 시드 데이터로 시작한다.
 */
export function sanitizeState(raw: unknown): UserState | null {
  if (!isObj(raw) || !Array.isArray(raw.enrollments) || !Array.isArray(raw.activity)) {
    return null;
  }

  const lessonProgress: Record<string, LessonStatus> = {};
  if (isObj(raw.lessonProgress)) {
    for (const [id, v] of Object.entries(raw.lessonProgress)) {
      if (getLesson(id) && LESSON_STATUSES.includes(v as LessonStatus)) {
        lessonProgress[id] = v as LessonStatus;
      }
    }
  }

  const assignments: Record<string, AssignmentSubmission> = {};
  if (isObj(raw.assignments)) {
    for (const [id, v] of Object.entries(raw.assignments)) {
      if (isObj(v) && isStr(v.text) && (v.status === "pending" || v.status === "submitted" || v.status === "completed")) {
        assignments[id] = {
          status: v.status,
          text: v.text,
          submittedAt: isIsoDate(v.submittedAt) ? v.submittedAt : null,
        };
      }
    }
  }

  const assignmentDue: Record<string, string> = {};
  if (isObj(raw.assignmentDue)) {
    for (const [id, v] of Object.entries(raw.assignmentDue)) {
      if (isStr(v) && /^\d{4}-\d{2}-\d{2}$/.test(v)) assignmentDue[id] = v;
    }
  }

  const prefs = isObj(raw.notifications) ? raw.notifications : {};
  const notifications: NotificationPrefs = {
    daily: typeof prefs.daily === "boolean" ? prefs.daily : DEFAULT_NOTIFICATIONS.daily,
    assignment:
      typeof prefs.assignment === "boolean" ? prefs.assignment : DEFAULT_NOTIFICATIONS.assignment,
    marketing:
      typeof prefs.marketing === "boolean" ? prefs.marketing : DEFAULT_NOTIFICATIONS.marketing,
  };

  const interests = list(raw.interests, isStr) as CategoryId[];

  // 같은 강의가 두 번 들어간 수강 목록은 첫 항목만 남긴다
  const seen = new Set<string>();
  const enrollments = list(raw.enrollments, isEnrollment)
    .filter((e) => (seen.has(e.courseId) ? false : (seen.add(e.courseId), true)))
    .map((e) => ({
      courseId: e.courseId,
      enrolledAt: e.enrolledAt,
      lastLessonId: isStr(e.lastLessonId) && getLesson(e.lastLessonId) ? e.lastLessonId : null,
      lastStudiedAt: isIsoDate(e.lastStudiedAt) ? e.lastStudiedAt : null,
    }));

  return {
    name: isStr(raw.name) && raw.name.trim() ? raw.name : "김팀장",
    interests: interests.length > 0 ? interests : ["data"],
    enrollments,
    lessonProgress,
    quizResults: list(raw.quizResults, isQuizResult),
    notes: list(raw.notes, isNote).map((n) => ({
      ...n,
      lessonId: isStr(n.lessonId) ? n.lessonId : null,
      createdAt: isIsoDate(n.createdAt) ? n.createdAt : n.updatedAt,
    })),
    favorites: Array.from(new Set(list(raw.favorites, isStr).filter((id) => getCourse(id)))),
    assignments,
    assignmentDue,
    activity: list(raw.activity, isActivity),
    unlockedAchievements: Array.from(new Set(list(raw.unlockedAchievements, isStr))),
    notifications,
  };
}
