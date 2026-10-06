// Supabase 스키마(users / instructors / courses / course_sections / lessons /
// enrollments / lesson_progress / quizzes / quiz_questions / quiz_results /
// assignments / notes / reviews / favorites)를 그대로 반영한 타입 정의.
// MVP에서는 동일 구조를 로컬 데이터 레이어로 제공한다.

export type CategoryId =
  | "dev"
  | "ai"
  | "data"
  | "design"
  | "marketing"
  | "business"
  | "career"
  | "language";

export interface Category {
  id: CategoryId;
  name: string;
}

export interface Instructor {
  id: string;
  name: string;
  title: string;
  bio: string;
  field: CategoryId;
}

export type CourseLevel = "beginner" | "intermediate" | "advanced";

export interface Lesson {
  id: string;
  sectionId: string;
  courseId: string;
  order: number;
  title: string;
  durationMin: number;
}

export interface CourseSection {
  id: string;
  courseId: string;
  order: number;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  categoryId: CategoryId;
  instructorId: string;
  level: CourseLevel;
  price: number; // 0 = 무료
  rating: number;
  reviewCount: number;
  studentCount: number;
  totalMinutes: number;
  thumbnailTone: number; // gradient placeholder variation (0-5)
  tags: string[];
  goals: string[]; // 학습 대상 / 이런 분께 추천
  requirements: string[]; // 준비사항
  sections: CourseSection[];
}

export interface QuizQuestion {
  id: string;
  topic: string; // 취약 주제 집계 단위
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueInDays: number; // 첫 방문(시딩) 기준 마감까지 남은 일수 — 실제 마감일은 상태에 저장
}

export interface Review {
  id: string;
  courseId: string;
  author: string;
  rating: number;
  content: string;
  date: string;
}

// ---- 사용자 상태 (localStorage 영속) ----

export type LessonStatus = "not_started" | "in_progress" | "completed";
export type AssignmentStatus = "pending" | "submitted" | "completed";

export interface Enrollment {
  courseId: string;
  enrolledAt: string;
  lastLessonId: string | null;
  lastStudiedAt: string | null;
}

export interface QuizResult {
  id: string;
  quizId: string;
  /** full: 전체 풀이(점수 집계 대상) / review: 틀린 문제만 다시 풀기 */
  mode: "full" | "review";
  score: number; // 100점 만점
  correct: number;
  total: number;
  questionIds: string[]; // 이번 시도에서 푼 문항
  answers: number[]; // questionIds와 같은 순서의 선택 보기
  date: string;
}

export interface Note {
  id: string;
  courseId: string;
  lessonId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentSubmission {
  status: AssignmentStatus;
  text: string;
  submittedAt: string | null;
}

// 모든 학습 행동은 활동 로그에 남는다.
// 연속 학습일·최근 7일 학습시간·캘린더·오늘의 목표·최근 기록이 전부 여기서 계산된다.
export type ActivityType =
  | "lesson"
  | "quiz"
  | "review"
  | "assignment"
  | "note"
  | "enroll"
  | "achievement";

export interface Activity {
  id: string;
  type: ActivityType;
  at: string; // ISO
  label: string;
  minutes?: number; // lesson만
  courseId?: string;
  lessonId?: string;
  quizId?: string;
  assignmentId?: string;
  achievementId?: string;
  score?: number;
}

export interface UserState {
  name: string;
  interests: CategoryId[];
  enrollments: Enrollment[];
  lessonProgress: Record<string, LessonStatus>;
  quizResults: QuizResult[];
  notes: Note[];
  favorites: string[];
  assignments: Record<string, AssignmentSubmission>;
  assignmentDue: Record<string, string>; // 과제 id → 마감일(YYYY-MM-DD)
  activity: Activity[]; // 최신순
  unlockedAchievements: string[];
  /** 알림 설정. 이전 버전 저장 데이터에는 없을 수 있다 → 기본값으로 채운다 */
  notifications?: NotificationPrefs;
}

export interface NotificationPrefs {
  daily: boolean;
  assignment: boolean;
  marketing: boolean;
}
