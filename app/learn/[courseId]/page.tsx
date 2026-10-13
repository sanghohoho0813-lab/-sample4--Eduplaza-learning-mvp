"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { notFound, useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  ListVideo,
  NotebookPen,
  Pause,
  PenSquare,
  Play,
  PlayCircle,
  RotateCcw,
} from "lucide-react";
import { ASSIGNMENTS, QUIZZES, courseLessons, formatMinutes, getCourse, getInstructor } from "@/lib/data";
import { WEEKLY_GOAL_MIN, dueLabel, useStore } from "@/lib/store";
import { daysUntil } from "@/lib/learning";
import { weeklyGoalMessage } from "@/lib/insights";
import type { Course, Lesson } from "@/lib/types";
import { useToast } from "@/components/Toast";
import { ProgressBar } from "@/components/ProgressBar";
import { PlayerSkeleton } from "@/components/Skeletons";
import { CourseThumbnail } from "@/components/Thumbnail";
import { Portal } from "@/components/Portal";

const DEMO_PLAY_SECONDS = 24; // 데모 재생: 24초 만에 레슨 1개 완료

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

type Tab = "notes" | "curriculum" | "tasks" | "about";

function PlayerContent() {
  const params = useParams<{ courseId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const store = useStore();
  const { toast } = useToast();

  const course = getCourse(params.courseId);
  const lessons = useMemo(() => (course ? courseLessons(course) : []), [course]);

  const lessonParam = searchParams.get("lesson");
  const seekParam = Number(searchParams.get("t") ?? 0);
  const lesson =
    lessons.find((l) => l.id === lessonParam) ??
    (course ? store.nextLesson(course.id) ?? lessons[0] : undefined);

  const [playing, setPlaying] = useState(false);
  const [pct, setPct] = useState(0);
  const [tab, setTab] = useState<Tab>("notes");
  const [noteDraft, setNoteDraft] = useState("");
  const [stampNote, setStampNote] = useState(true);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const [focusNote, setFocusNote] = useState(false);
  // '메모 남기기'를 누르면 노트 탭을 열고 입력칸으로 바로 데려간다
  useEffect(() => {
    if (!focusNote) return;
    noteRef.current?.focus({ preventScroll: true });
    noteRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setFocusNote(false);
  }, [focusNote]);
  const completedFired = useRef(false);
  const lastTracked = useRef<string | null>(null);
  // 완료 직전 값 — 완료 패널에서 "67% → 75%"처럼 변화량을 보여준다
  const [before, setBefore] = useState<{ pct: number; weekly: number; planDone: number } | null>(null);

  const lessonId = lesson?.id;
  const courseId = course?.id;
  const isCompleted = lessonId ? store.lessonStatus(lessonId) === "completed" : false;

  // 레슨 변경 시 플레이어 리셋 (메모의 재생 시점 링크로 들어오면 그 위치부터)
  useEffect(() => {
    const total = (lesson?.durationMin ?? 1) * 60;
    setPct(seekParam > 0 ? Math.min(99, (seekParam / total) * 100) : 0);
    setPlaying(false);
    setBefore(null);
    completedFired.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  const enrolled = courseId ? store.isEnrolled(courseId) : false;

  // 주소에 레슨이 없으면 지금 고른 레슨을 주소에 고정한다.
  // (안 그러면 완료 처리 순간 '다음 레슨'이 다시 계산돼 완료 화면 없이 넘어가 버린다)
  useEffect(() => {
    if (lessonParam || !courseId || !lessonId || !store.ready) return;
    router.replace(`/learn/${courseId}?lesson=${lessonId}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonParam, courseId, lessonId, store.ready]);
  useEffect(() => {
    if (!courseId || !lessonId || !store.ready || !enrolled) return;
    if (lastTracked.current === lessonId) return;
    lastTracked.current = lessonId;
    store.setLastLesson(courseId, lessonId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, lessonId, store.ready, enrolled]);

  // 목차가 길어도 지금 듣는 레슨이 보이도록 목록 안에서만 스크롤한다
  useEffect(() => {
    document.querySelectorAll<HTMLElement>("[data-curriculum]").forEach((box) => {
      const el = box.querySelector<HTMLElement>('[data-active="true"]');
      if (el) box.scrollTop = el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2;
    });
  }, [lessonId, store.ready, tab]);

  const idx = lessons.findIndex((l) => l.id === lessonId);
  const prevLesson = idx > 0 ? lessons[idx - 1] : null;
  const nextL = idx >= 0 && idx < lessons.length - 1 ? lessons[idx + 1] : null;

  const markComplete = useCallback(() => {
    if (!course || !lesson || completedFired.current || isCompleted) return;
    completedFired.current = true;
    setBefore({
      pct: store.courseProgress(course.id),
      weekly: store.weeklyTotal,
      planDone: store.todayPlan.filter((p) => p.done).length,
    });
    store.completeLesson(course.id, lesson);
  }, [course, lesson, isCompleted, store]);

  // 데모 재생 타이머
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setPct((p) => {
        const np = p + 100 / (DEMO_PLAY_SECONDS * 4);
        if (np >= 100) {
          clearInterval(timer);
          setPlaying(false);
          return 100;
        }
        return np;
      });
    }, 250);
    return () => clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    if (pct >= 100) markComplete();
  }, [pct, markComplete]);

  if (!course || !lesson) return notFound();

  if (!store.ready) return <PlayerSkeleton />;

  if (!enrolled) {
    return (
      <div className="mx-auto max-w-lg animate-fade-up">
        <div className="card overflow-hidden">
          <CourseThumbnail
            tone={course.thumbnailTone}
            title={course.title}
            courseId={course.id}
            rounded="rounded-none"
            priority
            sizes="(min-width: 640px) 512px, 100vw"
          />
          <div className="p-6 text-center md:p-8">
            <p className="text-sm font-semibold text-forest-600">아직 수강 신청 전이에요</p>
            <h1 className="mt-1.5 font-display text-xl font-semibold leading-snug text-forest-950">
              {course.title}
            </h1>
            <p className="mt-2 text-sm text-forest-950/68">
              수강 신청하면 &lsquo;{lesson.title}&rsquo;부터 바로 볼 수 있어요.
            </p>
            <div className="mt-6 flex flex-col gap-2.5">
              <button
                onClick={() => {
                  store.enroll(course.id);
                  toast("수강 신청 완료! 바로 시작해볼까요?", "celebrate");
                }}
                className="btn-press inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-forest-900 text-sm font-bold text-cream-50 transition-colors hover:bg-forest-800"
              >
                <PlayCircle size={18} />
                수강 신청하고 시작하기
              </button>
              <Link
                href={`/courses/${course.id}`}
                className="inline-flex min-h-[48px] items-center justify-center text-sm font-semibold text-forest-950/72 hover:text-forest-950"
              >
                강의 정보 먼저 보기
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const coursePct = store.courseProgress(course.id);
  const doneCount = lessons.filter((l) => store.lessonStatus(l.id) === "completed").length;
  const remaining = lessons.filter((l) => store.lessonStatus(l.id) !== "completed");
  const remainingMin = remaining.reduce((s, l) => s + l.durationMin, 0);
  const totalSec = lesson.durationMin * 60;
  const curSec = (pct / 100) * totalSec;
  const section = course.sections.find((s) => s.id === lesson.sectionId);
  const lessonNotes = store.state.notes.filter((n) => n.lessonId === lesson.id);
  const goTo = (l: Lesson | null) => l && router.push(`/learn/${course.id}?lesson=${l.id}`);

  const togglePlay = () => {
    if (pct >= 100) {
      setPct(0);
      setPlaying(true);
    } else {
      setPlaying((p) => !p);
    }
  };

  const saveNote = () => {
    const content = noteDraft.trim();
    if (!content) return;
    store.addNote(course.id, lesson.id, content, stampNote && curSec > 0 ? curSec : undefined);
    setNoteDraft("");
    toast(stampNote && curSec > 0 ? `${fmt(curSec)} 지점에 메모했어요` : "메모를 저장했어요");
  };

  const seek = (sec: number) => {
    setPlaying(false);
    setPct(Math.min(99, (sec / totalSec) * 100));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const tabs: { key: Tab; label: string; icon: typeof FileText; mobileOnly?: boolean }[] = [
    { key: "notes", label: lessonNotes.length ? `메모 ${lessonNotes.length}` : "메모", icon: NotebookPen },
    { key: "curriculum", label: "목차", icon: ListVideo, mobileOnly: true },
    { key: "tasks", label: "퀴즈·과제", icon: PenSquare, mobileOnly: true },
    { key: "about", label: "레슨 정보", icon: FileText },
  ];

  return (
    <div className="animate-fade-up pb-24 lg:pb-0">
      {/* 상단: 강의로 돌아가기 + 전체 진도 */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          href={`/courses/${course.id}`}
          className="btn-press inline-flex min-h-[44px] min-w-0 items-center gap-1 text-sm font-semibold text-forest-950/68 hover:text-forest-950"
        >
          <ChevronLeft size={16} className="shrink-0" />
          <span className="truncate">{course.title}</span>
        </Link>
        <div className="flex shrink-0 items-center gap-2.5" aria-label={`레슨 ${doneCount}/${lessons.length} 완료, 진도 ${coursePct}%`}>
          <span className="hidden text-xs font-medium text-forest-950/68 sm:inline">
            레슨 {doneCount}/{lessons.length}
          </span>
          <div className="w-16 sm:w-28">
            <ProgressBar label="강의 진도" value={coursePct} height="h-1.5" animate={false} />
          </div>
          <span className="text-sm font-bold text-forest-700">{coursePct}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr),360px]">
        <div className="min-w-0">
          {/* 데모 비디오 플레이어 — 모바일에서는 스크롤해도 상단에 고정 */}
          <div className="sticky top-0 z-20 -mx-4 overflow-hidden bg-forest-950 shadow-card sm:-mx-6 sm:rounded-2xl lg:static lg:mx-0 lg:rounded-2xl">
            <div className="relative aspect-video">
              <div className="absolute inset-0 bg-gradient-to-br from-forest-900 via-forest-950 to-forest-800" />
              <div className="absolute -left-10 top-6 h-40 w-40 rounded-full bg-forest-500/20 blur-3xl" />
              <div className="absolute bottom-4 right-10 h-32 w-32 rounded-full bg-gold-500/10 blur-3xl" />

              <div className="absolute inset-0 flex flex-col items-center justify-center px-6 pb-8 text-center">
                <p className="mb-4 hidden text-xs font-semibold uppercase tracking-[0.2em] text-cream-200/65 sm:block">
                  Lesson {idx + 1} / {lessons.length}
                </p>
                <button
                  onClick={togglePlay}
                  aria-label={playing ? "일시정지" : pct >= 100 ? "다시 재생" : "재생"}
                  className="btn-press flex h-16 w-16 items-center justify-center rounded-full bg-cream-100/95 text-forest-950 shadow-glow transition-transform hover:scale-105 md:h-20 md:w-20"
                >
                  {playing ? (
                    <Pause size={26} />
                  ) : pct >= 100 ? (
                    <RotateCcw size={24} />
                  ) : (
                    <Play size={26} className="ml-1" />
                  )}
                </button>
                {pct >= 100 && (
                  <p className="mt-3 text-sm font-semibold text-forest-300">레슨 시청 완료</p>
                )}
              </div>

              {/* 하단 컨트롤 */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-forest-950/90 to-transparent px-4 pb-3.5 pt-8 md:px-5">
                <ProgressBar
                  label="재생 위치"
                  value={pct}
                  trackClass="bg-cream-50/15"
                  fillClass="bg-gradient-to-r from-cream-300 to-gold-300"
                  height="h-1.5"
                  animate={false}
                />
                <div className="mt-2 flex items-center justify-between text-xs text-cream-200/70">
                  <span>
                    {fmt(curSec)} / {fmt(totalSec)}
                  </span>
                  <span className="hidden sm:inline">데모 플레이어 · 재생 시 빠르게 진행돼요</span>
                </div>
              </div>
            </div>
          </div>

          {/* 레슨 머리 — 제목과 완료 버튼을 한 줄에(PC) */}
          <div className="mt-5 flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-forest-950/68">
                {section?.title} · 레슨 {idx + 1}/{lessons.length} · {lesson.durationMin}분
              </p>
              <h1 className="mt-1 text-lg font-bold leading-snug text-forest-950 md:text-xl">
                {lesson.title}
              </h1>
            </div>
            <div className="hidden shrink-0 items-center gap-2 lg:flex">
              <button
                onClick={() => goTo(prevLesson)}
                disabled={!prevLesson}
                aria-label="이전 레슨"
                className="btn-press flex h-11 w-11 items-center justify-center rounded-full border border-cream-300 bg-white text-forest-950 disabled:opacity-40"
              >
                <ChevronLeft size={18} />
              </button>
              <CompleteButton done={isCompleted} onClick={markComplete} />
            </div>
          </div>

          {/* 다음 레슨 — 항상 보이게(완료 전엔 미리보기, 완료 후엔 다음 행동) */}
          {isCompleted ? (
            <LessonDonePanel
              course={course}
              lesson={lesson}
              before={before}
              onWriteNote={() => {
                setTab("notes");
                setFocusNote(true);
              }}
            />
          ) : (
            nextL && (
              <button
                onClick={() => goTo(nextL)}
                className="group mt-4 flex w-full items-center gap-3 rounded-2xl border border-cream-300 bg-white/60 px-4 py-3 text-left transition-colors hover:border-forest-300 hover:bg-white"
              >
                <span className="text-xs font-semibold text-forest-950/68">다음</span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-forest-950">
                  {nextL.title}
                </span>
                <span className="shrink-0 text-xs text-forest-950/68">{nextL.durationMin}분</span>
                <ChevronRight size={16} className="shrink-0 text-forest-950/40 transition-transform group-hover:translate-x-0.5" />
              </button>
            )
          )}

          {/* 탭 */}
          <div className="mt-7">
            <div className="thin-scroll flex gap-1 overflow-x-auto border-b border-cream-200" role="tablist" aria-label="레슨 도구">
              {tabs.map(({ key, label, icon: Icon, mobileOnly }) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setTab(key)}
                  className={clsx(
                    "-mb-px inline-flex min-h-[48px] items-center gap-1.5 whitespace-nowrap border-b-2 px-3.5 text-sm font-semibold transition-colors",
                    mobileOnly && "lg:hidden",
                    tab === key
                      ? "border-forest-800 text-forest-950"
                      : "border-transparent text-forest-950/68 hover:text-forest-950"
                  )}
                >
                  <Icon size={15} aria-hidden />
                  {label}
                </button>
              ))}
            </div>

            <div className="pt-5" role="tabpanel">
              {tab === "notes" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-cream-300 bg-white p-3 focus-within:border-forest-400 focus-within:ring-2 focus-within:ring-forest-200">
                    <textarea
                      ref={noteRef}
                      aria-label="레슨 메모"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveNote();
                      }}
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder="지금 들은 내용을 내 말로 적어보세요"
                      rows={3}
                      className="w-full resize-none bg-transparent p-1.5 text-sm text-forest-950 outline-none placeholder:text-forest-950/35"
                    />
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                      <label className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 px-1 text-xs font-semibold text-forest-950/72">
                        <input
                          type="checkbox"
                          checked={stampNote}
                          onChange={(e) => setStampNote(e.target.checked)}
                          className="h-4 w-4 accent-forest-700"
                        />
                        재생 위치 {fmt(curSec)} 함께 저장
                      </label>
                      <button
                        onClick={saveNote}
                        disabled={!noteDraft.trim()}
                        className="btn-press min-h-[40px] rounded-full bg-forest-900 px-5 text-sm font-bold text-cream-50 disabled:opacity-40"
                      >
                        메모 저장
                      </button>
                    </div>
                  </div>
                  {lessonNotes.length > 0 ? (
                    <ul className="divide-y divide-cream-200">
                      {lessonNotes.map((n) => (
                        <li key={n.id} className="flex gap-3 py-3.5">
                          {typeof n.at === "number" ? (
                            <button
                              onClick={() => seek(n.at!)}
                              className="h-fit shrink-0 rounded-md bg-forest-50 px-2 py-1 font-mono text-xs font-semibold text-forest-700 hover:bg-forest-100"
                              aria-label={`${fmt(n.at)} 지점으로 이동`}
                            >
                              {fmt(n.at)}
                            </button>
                          ) : (
                            <span className="h-fit shrink-0 rounded-md bg-cream-100 px-2 py-1 text-xs font-semibold text-forest-950/68">
                              메모
                            </span>
                          )}
                          <p className="min-w-0 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-forest-950/85">
                            {n.content}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-forest-950/68">
                      아직 이 레슨의 메모가 없어요. 재생 위치와 함께 남겨두면 나중에 그 장면으로 바로 돌아올 수 있어요.
                    </p>
                  )}
                </div>
              )}

              {tab === "curriculum" && (
                <div className="lg:hidden">
                  <Curriculum course={course} activeId={lesson.id} />
                </div>
              )}

              {tab === "tasks" && (
                <div className="lg:hidden">
                  <CourseTasks course={course} />
                </div>
              )}

              {tab === "about" && (
                <div className="space-y-4 text-sm leading-relaxed text-forest-950/80">
                  <p>{course.description}</p>
                  <p className="text-forest-950/68">
                    {getInstructor(course.instructorId)?.name} 강사 · {section?.title} 섹션의 {lesson.order}번째 레슨
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PC 학습 패널: 진도 → 목차 → 이 강의의 퀴즈·과제 */}
        <aside className="hidden lg:block" aria-label="학습 패널">
          <div className="card sticky top-6 flex max-h-[calc(100vh-3rem)] flex-col overflow-hidden">
            <div className="border-b border-cream-100 p-5">
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-bold text-forest-950">학습 진도</h2>
                <span className="text-sm font-bold text-forest-700">{coursePct}%</span>
              </div>
              <ProgressBar label="강의 진도" value={coursePct} height="h-1.5" className="mt-2.5" animate={false} />
              <p className="mt-2 text-xs text-forest-950/68">
                {remaining.length > 0
                  ? `레슨 ${remaining.length}개 · ${formatMinutes(remainingMin)} 남았어요`
                  : "모든 레슨을 마쳤어요"}
              </p>
            </div>
            <div className="flex min-h-0 flex-1 flex-col px-3 py-2">
              <Curriculum course={course} activeId={lesson.id} />
            </div>
            <div className="border-t border-cream-100 p-4">
              <CourseTasks course={course} compact />
            </div>
          </div>
        </aside>
      </div>

      {/* 모바일·태블릿 하단 조작 바 — 하단 탭 대신 학습에 필요한 버튼만 */}
      <Portal>
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-200 bg-white/95 px-4 pt-3 shadow-[0_-4px_16px_rgba(19,31,25,0.08)] backdrop-blur lg:hidden"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <button
            onClick={() => goTo(prevLesson)}
            disabled={!prevLesson}
            aria-label="이전 레슨"
            className="btn-press flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-cream-300 bg-white text-forest-950 disabled:opacity-40"
          >
            <ChevronLeft size={19} />
          </button>
          {isCompleted && nextL ? (
            <button
              onClick={() => goTo(nextL)}
              className="btn-press inline-flex min-h-[48px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full bg-forest-900 px-4 text-sm font-bold text-cream-50"
            >
              <span className="truncate">다음 레슨</span>
              <ArrowRight size={16} className="shrink-0" />
            </button>
          ) : (
            <CompleteButton done={isCompleted} onClick={markComplete} className="min-w-0 flex-1" />
          )}
          <button
            onClick={() => goTo(nextL)}
            disabled={!nextL}
            aria-label="다음 레슨"
            className="btn-press flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-cream-300 bg-white text-forest-950 disabled:opacity-40"
          >
            <ChevronRight size={19} />
          </button>
        </div>
      </div>
      </Portal>
    </div>
  );
}

export default function PlayerPage() {
  return (
    <Suspense fallback={<PlayerSkeleton />}>
      <PlayerContent />
    </Suspense>
  );
}

function CompleteButton({
  done,
  onClick,
  className,
}: {
  done: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={done}
      className={clsx(
        "btn-press inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-full px-6 text-sm font-bold transition-colors",
        done ? "bg-forest-100 text-success" : "bg-forest-900 text-cream-50 hover:bg-forest-800",
        className
      )}
    >
      <CheckCircle2 size={17} className="shrink-0" />
      {done ? "학습 완료됨" : "학습 완료"}
    </button>
  );
}

/** 섹션별 목차 — 섹션마다 완료 개수를 보여주고, 지금 레슨을 강조한다 */
function Curriculum({ course, activeId }: { course: Course; activeId: string }) {
  const store = useStore();
  return (
    <ul data-curriculum className="thin-scroll relative max-h-[60vh] space-y-1 overflow-y-auto pr-1 lg:max-h-none lg:min-h-0 lg:flex-1">
      {course.sections.map((section) => {
        const done = section.lessons.filter((l) => store.lessonStatus(l.id) === "completed").length;
        return (
          <li key={section.id}>
            <p className="flex items-center justify-between gap-2 px-2 pb-1.5 pt-3 text-xs font-bold text-forest-950/68">
              <span className="truncate">
                {section.order}. {section.title}
              </span>
              <span className="shrink-0 font-semibold">
                {done}/{section.lessons.length}
              </span>
            </p>
            <ul className="space-y-0.5">
              {section.lessons.map((l) => {
                const st = store.lessonStatus(l.id);
                const active = l.id === activeId;
                return (
                  <li key={l.id}>
                    <Link
                      href={`/learn/${course.id}?lesson=${l.id}`}
                      data-active={active}
                      aria-current={active ? "true" : undefined}
                      className={clsx(
                        "flex min-h-[44px] items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors",
                        active ? "bg-forest-900 font-semibold text-cream-50" : "text-forest-950/80 hover:bg-cream-100"
                      )}
                    >
                      {st === "completed" ? (
                        <CheckCircle2 size={16} className={clsx("shrink-0", active ? "text-forest-300" : "text-success")} aria-label="완료" />
                      ) : active ? (
                        <PlayCircle size={16} className="shrink-0 text-gold-300" aria-label="재생 중" />
                      ) : (
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center text-xs font-semibold text-forest-950/50">
                          {l.order}
                        </span>
                      )}
                      <span className="flex-1 leading-snug">{l.title}</span>
                      <span className={clsx("shrink-0 text-xs", active ? "text-cream-200/70" : "text-forest-950/68")}>
                        {l.durationMin}분
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}

/** 이 강의에 딸린 퀴즈·과제 — 지금 상태(점수·틀린 문제·마감)와 바로가기 */
function CourseTasks({ course, compact = false }: { course: Course; compact?: boolean }) {
  const store = useStore();
  const quizzes = QUIZZES.filter((q) => q.courseId === course.id);
  const assignments = ASSIGNMENTS.filter((a) => a.courseId === course.id);

  if (quizzes.length === 0 && assignments.length === 0) {
    return <p className="text-sm text-forest-950/68">이 강의에는 퀴즈·과제가 없어요.</p>;
  }

  return (
    <div>
      {compact && <h2 className="mb-2 px-1 text-sm font-bold text-forest-950">이 강의의 퀴즈·과제</h2>}
      <ul className="space-y-1">
        {quizzes.map((q) => {
          const best = store.bestScore(q.id);
          const wrong = store.weakQuestions.filter((w) => w.quizId === q.id).length;
          const href = wrong > 0 ? `/quiz/${q.id}?mode=review` : `/quiz/${q.id}`;
          return (
            <li key={q.id}>
              <Link href={href} className="group flex min-h-[52px] items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-cream-50">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-forest-50 text-forest-700">
                  {wrong > 0 ? <RotateCcw size={16} /> : <PenSquare size={16} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-forest-950">{q.title}</span>
                  <span className="block truncate text-xs text-forest-950/68">
                    {best === null ? `${q.questions.length}문항 · 아직 안 풀었어요` : `최고 ${best}점`}
                    {wrong > 0 && ` · 틀린 문제 ${wrong}개`}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-semibold text-forest-700">
                  {wrong > 0 ? "복습" : best === null ? "풀기" : "다시"}
                </span>
              </Link>
            </li>
          );
        })}
        {assignments.map((a) => {
          const submitted = store.assignmentStatus(a.id) !== "pending";
          const dLeft = daysUntil(store.assignmentDue(a.id));
          return (
            <li key={a.id}>
              <Link
                href={`/quiz?tab=assignment#${a.id}`}
                className="group flex min-h-[52px] items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-cream-50"
              >
                <span
                  className={clsx(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    submitted ? "bg-forest-50 text-success" : "bg-amber-50 text-amber-600"
                  )}
                >
                  {submitted ? <Check size={16} /> : <ClipboardList size={16} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-forest-950">{a.title}</span>
                  <span className={clsx("block truncate text-xs", submitted ? "text-forest-950/68" : "font-semibold text-amber-700")}>
                    {submitted ? "제출 완료" : `과제 · ${dueLabel(dLeft)}`}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * 레슨을 끝낸 순간 "무엇이 바뀌었는지"를 보여주고, 다음 행동을 하나만 강조한다.
 * before가 없으면(이미 끝낸 레슨을 다시 연 경우) 변화량 대신 다음 차례만 안내한다.
 */
function LessonDonePanel({
  course,
  lesson,
  before,
  onWriteNote,
}: {
  course: Course;
  lesson: Lesson;
  before: { pct: number; weekly: number; planDone: number } | null;
  onWriteNote: () => void;
}) {
  const store = useStore();
  const pct = store.courseProgress(course.id);
  const upNext = store.nextLesson(course.id);
  const courseDone = pct >= 100;
  const quiz = QUIZZES.find((q) => q.courseId === course.id);
  const planDone = store.todayPlan.filter((p) => p.done).length;
  const notedToday = store.state.notes.some(
    (n) => n.lessonId === lesson.id && Date.now() - new Date(n.createdAt).getTime() < 6 * 3600 * 1000
  );

  const primary = upNext
    ? { href: `/learn/${course.id}?lesson=${upNext.id}`, label: `다음 레슨 · ${upNext.title}`, icon: PlayCircle }
    : quiz
      ? { href: `/quiz/${quiz.id}`, label: "퀴즈로 마무리하기", icon: PenSquare }
      : { href: "/courses", label: "다음 강의 찾아보기", icon: ArrowRight };
  const PrimaryIcon = primary.icon;

  return (
    <section aria-live="polite" className="mt-4 rounded-2xl bg-forest-50 p-5 animate-scale-in md:p-6">
      <p className="flex items-center gap-2 text-base font-bold text-forest-950">
        <CheckCircle2 size={19} className="shrink-0 text-success" />
        {before
          ? courseDone
            ? `‘${course.title}’ 완주! 수고했어요`
            : `레슨 완료! 진도가 ${pct}%로 올랐어요`
          : "이미 완료한 레슨이에요"}
      </p>

      {before ? (
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-forest-950/68">강의 진도</dt>
            <dd className="font-semibold text-forest-950">
              {before.pct}% → <span className="text-forest-700">{pct}%</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-forest-950/68">이번 주</dt>
            <dd className="font-semibold text-forest-950">
              +{lesson.durationMin}분 · {formatMinutes(store.weeklyTotal)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-forest-950/68">오늘 할 일</dt>
            <dd className="font-semibold text-forest-950">
              {planDone}/{store.todayPlan.length} 완료
            </dd>
          </div>
          <div>
            <dt className="text-xs text-forest-950/68">연속 학습</dt>
            <dd className="font-semibold text-forest-950">{store.streak}일</dd>
          </div>
          <p className="col-span-2 text-sm text-forest-950/72 sm:col-span-4">
            {weeklyGoalMessage(store.weeklyTotal, WEEKLY_GOAL_MIN)}
          </p>
        </dl>
      ) : (
        <p className="mt-1 text-sm text-forest-950/72">
          {upNext ? `다음은 ‘${upNext.title}’ 차례예요.` : "이 강의의 모든 레슨을 마쳤어요."}
        </p>
      )}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
        <Link
          href={primary.href}
          className="btn-press inline-flex min-h-[52px] min-w-0 items-center justify-center gap-2 rounded-full bg-forest-900 px-6 text-sm font-bold text-cream-50 transition-colors hover:bg-forest-800"
        >
          <PrimaryIcon size={18} className="shrink-0" />
          <span className="truncate">{primary.label}</span>
        </Link>
        {upNext && quiz && (
          <Link
            href={`/quiz/${quiz.id}`}
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 text-sm font-semibold text-forest-700 hover:text-forest-950"
          >
            <PenSquare size={15} />
            퀴즈로 확인
          </Link>
        )}
        {!notedToday && (
          <button
            onClick={onWriteNote}
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 text-sm font-semibold text-forest-700 hover:text-forest-950"
          >
            <NotebookPen size={15} />
            핵심 내용 메모하기
          </button>
        )}
      </div>
    </section>
  );
}
