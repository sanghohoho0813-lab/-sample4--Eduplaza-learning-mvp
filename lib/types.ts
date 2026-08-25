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
  dueDate: string; // ISO date
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
  score: number; // 100점 만점
  correct: number;
  total: number;
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

export interface Mission {
  id: string;
  label: string;
  done: boolean;
}

export interface UserState {
  name: string;
  interests: CategoryId[];
  streakDays: number;
  weeklyMinutes: number[]; // 월~일 학습시간(분)
  enrollments: Enrollment[];
  lessonProgress: Record<string, LessonStatus>;
  quizResults: QuizResult[];
  notes: Note[];
  favorites: string[];
  assignments: Record<string, AssignmentSubmission>;
  missions: Mission[];
  unlockedAchievements: string[];
}
