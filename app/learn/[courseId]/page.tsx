"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  notFound,
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  FileText,
  ListVideo,
  MessageCircleQuestion,
  NotebookPen,
  Pause,
  PenSquare,
  Play,
  PlayCircle,
  RotateCcw,
} from "lucide-react";
import { QUIZZES, courseLessons, getCourse, getInstructor } from "@/lib/data";
import { WEEKLY_GOAL_MIN, useStore } from "@/lib/store";
import { weeklyGoalMessage } from "@/lib/insights";
import { useToast } from "@/components/Toast";
import { ProgressBar } from "@/components/ProgressBar";
import { PlayerSkeleton } from "@/components/Skeletons";
import { CourseThumbnail } from "@/components/Thumbnail";

const DEMO_PLAY_SECONDS = 24; // 데모 재생: 24초 만에 레슨 1개 완료

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

type Tab = "curriculum" | "about" | "notes" | "qna" | "files";

function PlayerContent() {
  const params = useParams<{ courseId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const store = useStore();
  const { toast } = useToast();

  const course = getCourse(params.courseId);
  const lessons = useMemo(() => (course ? courseLessons(course) : []), [course]);

  const lessonParam = searchParams.get("lesson");
  const lesson =
    lessons.find((l) => l.id === lessonParam) ??
    (course ? store.nextLesson(course.id) ?? lessons[0] : undefined);

  const [playing, setPlaying] = useState(false);
  const [pct, setPct] = useState(0);
  const [tab, setTab] = useState<Tab>("about");
  const [noteDraft, setNoteDraft] = useState("");
  const completedFired = useRef(false);
  const lastTracked = useRef<string | null>(null);
  const [justCompleted, setJustCompleted] = useState(false);

  const lessonId = lesson?.id;
  const courseId = course?.id;
  const isCompleted = lessonId
    ? store.lessonStatus(lessonId) === "completed"
    : false;

  // 레슨 변경 시 플레이어 리셋 + 마지막 학습 위치 기록
  useEffect(() => {
    setPct(0);
    setPlaying(false);
    setJustCompleted(false);
    completedFired.current = false;
  }, [lessonId]);

  const enrolled = courseId ? store.isEnrolled(courseId) : false;
  useEffect(() => {
    if (!courseId || !lessonId || !store.ready || !enrolled) return;
    if (lastTracked.current === lessonId) return;
    lastTracked.current = lessonId;
    store.setLastLesson(courseId, lessonId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, lessonId, store.ready, enrolled]);

  // 커리큘럼 목록이 길어도 지금 듣는 레슨이 보이도록 목록 안에서만 스크롤한다
  useEffect(() => {
    document.querySelectorAll<HTMLElement>("[data-curriculum]").forEach((box) => {
      const el = box.querySelector<HTMLElement>('[data-active="true"]');
      if (el) box.scrollTop = el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2;
    });
  }, [lessonId, store.ready]);

  const idx = lessons.findIndex((l) => l.id === lessonId);
  const prevLesson = idx > 0 ? lessons[idx - 1] : null;
  const nextL = idx >= 0 && idx < lessons.length - 1 ? lessons[idx + 1] : null;

  const markComplete = useCallback(() => {
    if (!course || !lesson || completedFired.current || isCompleted) return;
    completedFired.current = true;
    store.completeLesson(course.id, lesson);
    setJustCompleted(true);
    toast("레슨 완료! 진도와 주간 학습시간에 반영했어요", "celebrate");
  }, [course, lesson, isCompleted, store, toast]);

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
          />
          <div className="p-6 text-center md:p-8">
            <p className="text-sm font-semibold text-forest-600">아직 수강 신청 전이에요</p>
            <h1 className="mt-1.5 font-display text-xl font-semibold leading-snug text-forest-950">
              {course.title}
            </h1>
            <p className="mt-2 text-sm text-forest-950/55">
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
                className="inline-flex min-h-[48px] items-center justify-center text-sm font-semibold text-forest-950/60 hover:text-forest-950"
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
  const quiz = QUIZZES.find((q) => q.courseId === course.id);
  const totalSec = lesson.durationMin * 60;
  const curSec = (pct / 100) * totalSec;
  const sectionOf = (sid: string) =>
    course.sections.find((s) => s.id === sid);

  const lessonNotes = store.state.notes.filter((n) => n.lessonId === lesson.id);

  const saveNote = () => {
    const content = noteDraft.trim();
    if (!content) return;
    store.addNote(course.id, lesson.id, content);
    setNoteDraft("");
    toast("학습노트를 저장했어요");
  };

  const CurriculumList = (
    <ul data-curriculum className="thin-scroll relative max-h-[480px] space-y-1 overflow-y-auto pr-1">
      {course.sections.map((section) => (
        <li key={section.id}>
          <p className="px-2 pb-1.5 pt-3 text-xs font-bold uppercase tracking-wide text-forest-950/40">
            Section {section.order}. {section.title}
          </p>
          <ul className="space-y-1">
            {section.lessons.map((l) => {
              const st = store.lessonStatus(l.id);
              const active = l.id === lesson.id;
              return (
                <li key={l.id}>
                  <Link
                    href={`/learn/${course.id}?lesson=${l.id}`}
                    data-active={active}
                    aria-current={active ? "true" : undefined}
                    className={clsx(
                      "flex min-h-[46px] items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-forest-900 font-semibold text-cream-50"
                        : "text-forest-950/75 hover:bg-cream-100"
                    )}
                  >
                    {st === "completed" ? (
                      <CheckCircle2
                        size={16}
                        className={clsx(
                          "shrink-0",
                          active ? "text-forest-300" : "text-success"
                        )}
                      />
                    ) : active ? (
                      <PlayCircle size={16} className="shrink-0 text-gold-300" />
                    ) : (
                      <Circle size={16} className="shrink-0 text-cream-400" />
                    )}
                    <span className="flex-1 leading-snug">{l.title}</span>
                    <span
                      className={clsx(
                        "text-xs",
                        active ? "text-cream-200/60" : "text-forest-950/35"
                      )}
                    >
                      {l.durationMin}분
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="animate-fade-up">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          href={`/courses/${course.id}`}
          className="btn-press inline-flex min-h-[44px] min-w-0 items-center gap-1 text-sm font-semibold text-forest-950/55 hover:text-forest-950"
        >
          <ChevronLeft size={16} className="shrink-0" />
          <span className="truncate">{course.title}</span>
        </Link>
        <div className="flex shrink-0 items-center gap-2.5">
          <span className="hidden text-xs text-forest-950/50 sm:inline">강의 진도</span>
          <div className="w-16 sm:w-28">
            <ProgressBar value={coursePct} height="h-1.5" animate={false} />
          </div>
          <span className="text-sm font-bold text-forest-700">{coursePct}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr),340px]">
        <div className="min-w-0">
          {/* 데모 비디오 플레이어 — 모바일에서는 스크롤해도 상단에 고정 */}
          <div className="sticky top-0 z-20 -mx-4 overflow-hidden bg-forest-950 shadow-card sm:-mx-6 sm:rounded-2xl lg:static lg:mx-0 lg:rounded-2xl">
            <div className="relative aspect-video">
              <div className="absolute inset-0 bg-gradient-to-br from-forest-900 via-forest-950 to-forest-800" />
              <div className="absolute -left-10 top-6 h-40 w-40 rounded-full bg-forest-500/20 blur-3xl" />
              <div className="absolute bottom-4 right-10 h-32 w-32 rounded-full bg-gold-500/10 blur-3xl" />

              <div className="absolute inset-0 flex flex-col items-center justify-center px-6 pb-8 text-center">
                <p className="mb-4 hidden text-xs font-semibold uppercase tracking-[0.2em] text-cream-200/40 sm:block">
                  Lesson {idx + 1} / {lessons.length}
                </p>
                <button
                  onClick={() => {
                    if (pct >= 100) {
                      setPct(0);
                      completedFired.current = false;
                      setPlaying(true);
                    } else {
                      setPlaying((p) => !p);
                    }
                  }}
                  aria-label={playing ? "일시정지" : "재생"}
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
                  <p className="mt-3 text-sm font-semibold text-forest-300">
                    레슨 시청 완료!
                  </p>
                )}
              </div>

              {/* 하단 컨트롤 */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-forest-950/90 to-transparent px-4 pb-3.5 pt-8 md:px-5">
                <ProgressBar
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
                  <span className="hidden sm:inline">
                    데모 플레이어 · 재생 시 빠르게 진행돼요
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 레슨 제목 */}
          <div className="mt-4">
            <p className="text-xs font-semibold text-forest-950/50">
              {sectionOf(lesson.sectionId)?.title} · 레슨 {idx + 1}/{lessons.length} · {lesson.durationMin}분
            </p>
            <h1 className="mt-1 text-lg font-bold leading-snug text-forest-950 md:text-xl">
              {lesson.title}
            </h1>
          </div>

          {/* 레슨 내비게이션 — 모바일에서도 한 줄 */}
          <div className="mt-4 grid grid-cols-[auto,minmax(0,1fr),auto] items-center gap-2 sm:flex sm:gap-2.5">
            <button
              onClick={() =>
                prevLesson &&
                router.push(`/learn/${course.id}?lesson=${prevLesson.id}`)
              }
              disabled={!prevLesson}
              aria-label="이전 레슨"
              className="btn-press inline-flex min-h-[48px] items-center gap-1 rounded-full border border-cream-300 bg-white px-3.5 text-sm font-semibold text-forest-950 disabled:opacity-40 sm:px-4"
            >
              <ChevronLeft size={16} />
              <span>
                이전<span className="hidden sm:inline"> 강의</span>
              </span>
            </button>
            <button
              onClick={markComplete}
              disabled={isCompleted}
              className={clsx(
                "btn-press inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-full px-5 text-sm font-bold transition-colors",
                isCompleted
                  ? "bg-forest-100 text-success"
                  : "bg-forest-900 text-cream-50 hover:bg-forest-800"
              )}
            >
              <CheckCircle2 size={16} className="shrink-0" />
              {isCompleted ? (
                "학습 완료됨"
              ) : (
                <span>
                  학습 완료<span className="hidden sm:inline"> 처리</span>
                </span>
              )}
            </button>
            <button
              onClick={() =>
                nextL && router.push(`/learn/${course.id}?lesson=${nextL.id}`)
              }
              disabled={!nextL}
              aria-label="다음 레슨"
              className="btn-press inline-flex min-h-[48px] items-center gap-1 rounded-full border border-cream-300 bg-white px-3.5 text-sm font-semibold text-forest-950 disabled:opacity-40 sm:px-4"
            >
              <span>
                다음<span className="hidden sm:inline"> 강의</span>
              </span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* 완료 후 다음 행동 — Primary는 하나만 */}
          {isCompleted && (
            <LessonDonePanel
              fresh={justCompleted}
              courseId={course.id}
              lessonMinutes={lesson.durationMin}
              quizId={quiz?.id}
              onWriteNote={() => setTab("notes")}
            />
          )}

          {/* 탭 */}
          <div className="mt-6">
            <div className="thin-scroll flex gap-1.5 overflow-x-auto border-b border-cream-200 pb-px">
              {(
                [
                  ["curriculum", "커리큘럼", ListVideo],
                  ["about", "강의 설명", FileText],
                  ["notes", "노트", NotebookPen],
                  ["qna", "Q&A", MessageCircleQuestion],
                  ["files", "자료", FileText],
                ] as [Tab, string, typeof FileText][]
              ).map(([key, label, Icon]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={clsx(
                    "inline-flex min-h-[44px] items-center gap-1.5 whitespace-nowrap border-b-2 px-3.5 text-sm font-semibold transition-colors",
                    key === "curriculum" && "lg:hidden",
                    tab === key
                      ? "border-forest-800 text-forest-950"
                      : "border-transparent text-forest-950/45 hover:text-forest-950/70"
                  )}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>

            <div className="pt-5">
              {tab === "curriculum" && <div className="lg:hidden">{CurriculumList}</div>}

              {tab === "about" && (
                <p className="text-sm leading-relaxed text-forest-950/70">
                  {course.description}
                </p>
              )}

              {tab === "notes" && (
                <div className="space-y-4">
                  <div className="card border border-cream-200 p-4 shadow-none">
                    <textarea
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder="강의를 들으며 중요한 내용을 기록해보세요."
                      rows={4}
                      className="w-full resize-none rounded-xl border border-cream-200 bg-cream-50 p-3.5 text-sm text-forest-950 outline-none placeholder:text-forest-950/35 focus:border-forest-400 focus:ring-2 focus:ring-forest-200"
                    />
                    <div className="mt-2.5 flex justify-end">
                      <button
                        onClick={saveNote}
                        disabled={!noteDraft.trim()}
                        className="btn-press rounded-full bg-forest-900 px-5 py-2.5 text-sm font-bold text-cream-50 disabled:opacity-40"
                      >
                        노트 저장
                      </button>
                    </div>
                  </div>
                  {lessonNotes.length > 0 ? (
                    <ul className="space-y-3">
                      {lessonNotes.map((n) => (
                        <li
                          key={n.id}
                          className="rounded-xl border border-cream-200 bg-cream-50 p-4"
                        >
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-forest-950/80">
                            {n.content}
                          </p>
                          <p className="mt-2 text-xs text-forest-950/40">
                            {new Date(n.updatedAt).toLocaleDateString("ko-KR")}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-forest-950/45">
                      이 레슨의 노트가 아직 없어요. 첫 기록을 남겨보세요.
                    </p>
                  )}
                </div>
              )}

              {tab === "qna" && (
                <div className="rounded-xl border border-cream-200 bg-cream-50 p-5 text-sm leading-relaxed text-forest-950/60">
                  <p className="font-semibold text-forest-950/80">
                    궁금한 점이 있나요?
                  </p>
                  <p className="mt-1">
                    수강생 Q&A는 곧 열릴 예정이에요. 지금은{" "}
                    {getInstructor(course.instructorId)?.name} 강사님의 답변이
                    준비되는 대로 알려드릴게요.
                  </p>
                </div>
              )}

              {tab === "files" && (
                <ul className="space-y-2">
                  {["강의 슬라이드.pdf", "실습 예제 파일.zip", "핵심 요약본.pdf"].map(
                    (f) => (
                      <li
                        key={f}
                        className="flex min-h-[52px] items-center gap-3 rounded-xl border border-cream-200 bg-white px-4 text-sm text-forest-950/75"
                      >
                        <FileText size={17} className="text-forest-500" />
                        {f}
                        <span className="ml-auto text-xs text-forest-950/35">
                          데모 자료
                        </span>
                      </li>
                    )
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* PC 커리큘럼 사이드 */}
        <aside className="hidden lg:block">
          <div className="card sticky top-6 p-4">
            <h3 className="mb-2 px-2 text-sm font-bold text-forest-950">
              커리큘럼
            </h3>
            {CurriculumList}
          </div>
        </aside>
      </div>
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

function LessonDonePanel({
  fresh,
  courseId,
  lessonMinutes,
  quizId,
  onWriteNote,
}: {
  fresh: boolean;
  courseId: string;
  lessonMinutes: number;
  quizId?: string;
  onWriteNote: () => void;
}) {
  const store = useStore();
  const pct = store.courseProgress(courseId);
  const upNext = store.nextLesson(courseId); // 아직 안 끝낸 첫 레슨
  const courseDone = pct >= 100;
  const noteDone = store.todayGoals.find((g) => g.id === "note")?.done;

  const primary = upNext
    ? { href: `/learn/${courseId}?lesson=${upNext.id}`, label: "다음 강의 이어보기", icon: PlayCircle }
    : quizId
      ? { href: `/quiz/${quizId}`, label: "퀴즈로 마무리하기", icon: PenSquare }
      : { href: "/courses", label: "다음 강의 찾아보기", icon: ChevronRight };
  const PrimaryIcon = primary.icon;

  return (
    <section
      aria-live="polite"
      className="mt-4 rounded-2xl border border-forest-200 bg-forest-50 p-5 animate-scale-in md:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-base font-bold text-forest-950">
            <CheckCircle2 size={19} className="shrink-0 text-success" />
            {fresh
              ? courseDone
                ? "강의를 모두 완주했어요!"
                : `레슨 완료! 진도가 ${pct}%로 올랐어요`
              : "이미 완료한 레슨이에요"}
          </p>
          {fresh ? (
            <ul className="mt-2 space-y-0.5 text-sm text-forest-950/65">
              <li>
                +{lessonMinutes}분 · {weeklyGoalMessage(store.weeklyTotal, WEEKLY_GOAL_MIN)}
              </li>
              {store.streak > 0 && <li>{store.streak}일 연속 학습 중</li>}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-forest-950/60">
              {upNext ? `다음은 ‘${upNext.title}’ 차례예요.` : "이 강의의 모든 레슨을 마쳤어요."}
            </p>
          )}
        </div>
        <div className="w-full sm:w-auto">
          <Link
            href={primary.href}
            className="btn-press inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-forest-900 px-6 text-sm font-bold text-cream-50 transition-colors hover:bg-forest-800 sm:w-auto"
          >
            <PrimaryIcon size={18} />
            {primary.label}
          </Link>
        </div>
      </div>

      {fresh && (
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-forest-200/70 pt-3">
          {upNext && quizId && (
            <Link
              href={`/quiz/${quizId}`}
              className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-forest-700 hover:text-forest-950"
            >
              <PenSquare size={15} />
              배운 내용 퀴즈로 확인
            </Link>
          )}
          {!noteDone && (
            <button
              onClick={onWriteNote}
              className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-forest-700 hover:text-forest-950"
            >
              <NotebookPen size={15} />
              핵심 내용 노트로 남기기
            </button>
          )}
        </div>
      )}
    </section>
  );
}
