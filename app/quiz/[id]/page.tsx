"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { notFound, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import {
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronLeft,
  PlayCircle,
  RotateCcw,
  Trophy,
  X,
  XCircle,
} from "lucide-react";
import { QUIZZES, getCourse } from "@/lib/data";
import { useStore } from "@/lib/store";
import type { Quiz, QuizQuestion, QuizResult } from "@/lib/types";
import { useToast } from "@/components/Toast";
import { ListSkeleton } from "@/components/Skeletons";

const OPTION_LABELS = ["A", "B", "C", "D"];

type Mode = "full" | "review";

export default function QuizPlayPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={4} />}>
      <QuizPage />
    </Suspense>
  );
}

function QuizPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const quiz = QUIZZES.find((q) => q.id === params.id);
  const mode: Mode = searchParams.get("mode") === "review" ? "review" : "full";
  const [attempt, setAttempt] = useState(0);

  if (!quiz) return notFound();
  // 모드가 바뀌거나 다시 풀기를 누르면 풀이 상태를 통째로 새로 시작한다.
  return (
    <QuizRunner
      key={`${quiz.id}-${mode}-${attempt}`}
      quiz={quiz}
      mode={mode}
      onRetry={() => setAttempt((n) => n + 1)}
    />
  );
}

function QuizRunner({ quiz, mode, onRetry }: { quiz: Quiz; mode: Mode; onRetry: () => void }) {
  const store = useStore();
  const { toast } = useToast();
  const course = getCourse(quiz.courseId);

  // 풀 문항은 시작 시점에 고정한다(복습 도중 오답 목록이 바뀌어도 흔들리지 않게).
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [picks, setPicks] = useState<number[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    if (!store.ready || questions !== null) return;
    if (mode === "review") {
      const weakIds = new Set(
        store.weakQuestions.filter((w) => w.quizId === quiz.id).map((w) => w.questionId)
      );
      setQuestions(quiz.questions.filter((q) => weakIds.has(q.id)));
    } else {
      setQuestions(quiz.questions);
    }
  }, [store.ready, store.weakQuestions, questions, mode, quiz]);

  const question = questions?.[step];
  const cardRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLDivElement>(null);

  // 정답 확인 후 해설과 '다음 문제' 버튼이 화면 밖이면 보이게 끌어온다(모바일)
  useEffect(() => {
    if (checked) actionRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [checked]);
  // 다음 문제로 넘어가면 문제 카드 머리가 보이게
  useEffect(() => {
    if (step === 0) return;
    const el = cardRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    if (top < 0) window.scrollBy({ top: top - 16, behavior: "smooth" });
  }, [step]);

  const checkAnswer = useCallback(() => {
    if (selected === null || !question) return;
    setChecked(true);
    setPicks((p) => [...p, selected]);
  }, [selected, question]);

  const nextQuestion = useCallback(() => {
    if (!questions) return;
    if (step + 1 < questions.length) {
      setStep((s) => s + 1);
      setSelected(null);
      setChecked(false);
      return;
    }
    const saved = store.saveQuizResult(
      quiz.id,
      mode,
      questions.map((q) => q.id),
      picks
    );
    setResult(saved);
    if (mode === "full" && saved.score === 100) toast("퍼펙트 스코어! 정말 대단해요", "celebrate");
    else toast("결과를 저장했어요. 리포트에 바로 반영돼요.", "success");
  }, [questions, step, store, quiz.id, mode, picks, toast]);

  // 키보드: 1~4 보기 선택, Enter 정답 확인 / 다음 문제
  useEffect(() => {
    if (result || !question) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      const n = Number(e.key);
      if (!checked && n >= 1 && n <= question.options.length) {
        e.preventDefault();
        setSelected(n - 1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (checked) nextQuestion();
        else checkAnswer();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [result, question, checked, checkAnswer, nextQuestion]);

  if (!store.ready || questions === null) return <ListSkeleton rows={4} />;

  // 복습할 문제가 없는 경우
  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-xl animate-fade-up">
        <BackLink />
        <div className="card p-8 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-forest-50 text-success">
            <CheckCircle2 size={26} />
          </span>
          <h1 className="font-display text-xl font-semibold text-forest-950">
            다시 풀 문제가 없어요
          </h1>
          <p className="mt-2 text-sm text-forest-950/55">
            {quiz.title}의 틀린 문제를 모두 해결했어요.
          </p>
          <Link
            href={`/quiz/${quiz.id}`}
            className="btn-press mt-6 inline-flex min-h-[52px] items-center justify-center rounded-full bg-forest-900 px-7 text-sm font-bold text-cream-50"
          >
            처음부터 다시 풀기
          </Link>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <QuizResultView
        quiz={quiz}
        mode={mode}
        questions={questions}
        picks={picks}
        result={result}
        onRetry={onRetry}
      />
    );
  }

  if (!question) return null;
  const answered = picks.map((p, i) => p === questions[i].answerIndex);

  return (
    <div className="mx-auto max-w-2xl animate-fade-up">
      <BackLink />

      <div className="mb-5">
        <p className="text-xs font-medium text-forest-950/50">
          {course?.title}
          {mode === "review" && (
            <span className="ml-2 rounded-full bg-forest-50 px-2 py-0.5 font-semibold text-forest-700">
              틀린 문제 복습
            </span>
          )}
        </p>
        <h1 className="mt-1 font-display text-xl font-semibold text-forest-950 md:text-2xl">
          {quiz.title}
        </h1>
        {/* 진행 표시는 한 가지로 — 점 하나가 한 문제, 맞힘/틀림까지 보여준다 */}
        <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5" aria-hidden>
          {questions.map((qq, i) => (
            <span
              key={qq.id}
              className={clsx(
                "h-2.5 rounded-full transition-all duration-300",
                i < answered.length
                  ? answered[i]
                    ? "w-2.5 bg-success"
                    : "w-2.5 bg-danger"
                  : i === step
                    ? "w-6 bg-forest-800"
                    : "w-2.5 bg-cream-300"
              )}
            />
          ))}
        </div>
          <span className="shrink-0 text-sm font-bold text-forest-700">
            <span className="sr-only">전체 {questions.length}문제 중 </span>
            {step + 1}/{questions.length}
          </span>
        </div>
      </div>

      <div ref={cardRef} className="card p-5 md:p-7">
        <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
          Question {step + 1} · {question.topic}
        </p>
        <h2 className="mt-2 text-lg font-bold leading-relaxed text-forest-950">
          {question.question}
        </h2>

        <div className="mt-5 space-y-2.5">
          {question.options.map((opt, i) => {
            const isSelected = selected === i;
            const isAnswer = i === question.answerIndex;
            const showCorrect = checked && isAnswer;
            const showWrong = checked && isSelected && !isAnswer;
            return (
              <button
                key={i}
                onClick={() => !checked && setSelected(i)}
                disabled={checked}
                aria-pressed={isSelected}
                className={clsx(
                  "flex min-h-[56px] w-full items-center gap-3.5 rounded-2xl border-2 px-4 py-3 text-left text-sm transition-all duration-200 md:text-base",
                  showCorrect
                    ? "border-success bg-forest-50 text-forest-950"
                    : showWrong
                      ? "border-danger bg-danger/5 text-forest-950"
                      : isSelected
                        ? "border-forest-800 bg-forest-950 text-cream-50"
                        : "border-cream-200 bg-white text-forest-950/85 hover:border-forest-300",
                  !checked && "btn-press"
                )}
              >
                <span
                  className={clsx(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors",
                    showCorrect
                      ? "bg-success text-white"
                      : showWrong
                        ? "bg-danger text-white"
                        : isSelected
                          ? "bg-cream-100 text-forest-950"
                          : "bg-cream-100 text-forest-950/60"
                  )}
                >
                  {showCorrect ? (
                    <Check size={16} className="animate-check-pop" />
                  ) : showWrong ? (
                    <X size={16} className="animate-check-pop" />
                  ) : (
                    OPTION_LABELS[i]
                  )}
                </span>
                <span className="leading-snug">{opt}</span>
              </button>
            );
          })}
        </div>

        {checked && (
          <div
            className={clsx(
              "mt-5 flex gap-3 rounded-2xl p-4 animate-scale-in",
              selected === question.answerIndex ? "bg-forest-50" : "bg-cream-100"
            )}
          >
            {selected === question.answerIndex ? (
              <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-success" />
            ) : (
              <XCircle size={19} className="mt-0.5 shrink-0 text-danger" />
            )}
            <div>
              <p className="text-sm font-bold text-forest-950">
                {selected === question.answerIndex
                  ? "정답이에요!"
                  : `아쉬워요. 정답은 ${OPTION_LABELS[question.answerIndex]}입니다.`}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-forest-950/65">
                {question.explanation}
              </p>
            </div>
          </div>
        )}

        <p className="mt-4 hidden items-center justify-center gap-2 text-xs text-forest-950/40 md:flex">
          <kbd className="rounded border border-cream-300 bg-cream-50 px-1.5 py-0.5 font-sans font-semibold">
            1
          </kbd>
          ~
          <kbd className="rounded border border-cream-300 bg-cream-50 px-1.5 py-0.5 font-sans font-semibold">
            {question.options.length}
          </kbd>
          보기 선택 ·
          <kbd className="rounded border border-cream-300 bg-cream-50 px-1.5 py-0.5 font-sans font-semibold">
            Enter
          </kbd>
          {checked ? "다음 문제" : "정답 확인"}
        </p>

        <div ref={actionRef} className="mt-4 scroll-mb-32">
          {!checked ? (
            <button
              onClick={checkAnswer}
              disabled={selected === null}
              className="btn-press min-h-[52px] w-full rounded-full bg-forest-900 text-base font-bold text-cream-50 transition-colors hover:bg-forest-800 disabled:opacity-40"
            >
              정답 확인
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              className="btn-press inline-flex min-h-[52px] w-full items-center justify-center gap-1.5 rounded-full bg-forest-900 text-base font-bold text-cream-50 transition-colors hover:bg-forest-800"
            >
              {step + 1 >= questions.length ? "결과 보기" : "다음 문제"}
              <ArrowRight size={17} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/quiz"
      className="btn-press mb-4 inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-forest-950/55 hover:text-forest-950"
    >
      <ChevronLeft size={16} />
      퀴즈 목록
    </Link>
  );
}

function QuizResultView({
  quiz,
  mode,
  questions,
  picks,
  result,
  onRetry,
}: {
  quiz: Quiz;
  mode: Mode;
  questions: QuizQuestion[];
  picks: number[];
  result: QuizResult;
  onRetry: () => void;
}) {
  const store = useStore();
  const wrongNow = questions.filter((q, i) => picks[i] !== q.answerIndex);
  // 저장 직후의 스토어 기준 — 복습까지 반영된 "아직 남은" 틀린 문제
  const remaining = store.weakQuestions.filter((w) => w.quizId === quiz.id).length;
  const lesson = store.isEnrolled(quiz.courseId) ? store.nextLesson(quiz.courseId) : null;
  const quizGoalDone = store.todayGoals.find((g) => g.id === "quiz")?.done;

  // 다음 행동은 하나만 강조한다: 틀린 게 남았으면 복습, 아니면 강의로 복귀.
  // 이미 복습 화면이면 같은 주소로 이동해도 새로 시작되지 않으므로 직접 재시작한다.
  const primary: { label: string; icon: typeof RotateCcw; href?: string; onClick?: () => void } =
    remaining > 0
      ? mode === "review"
        ? { label: `남은 ${remaining}문제 다시 보기`, icon: RotateCcw, onClick: onRetry }
        : { label: `틀린 문제 ${remaining}개 다시 보기`, icon: RotateCcw, href: `/quiz/${quiz.id}?mode=review` }
      : lesson
        ? { label: "다음 강의 이어보기", icon: PlayCircle, href: `/learn/${quiz.courseId}?lesson=${lesson.id}` }
        : { label: "다른 퀴즈 풀기", icon: ArrowRight, href: "/quiz" };
  const PrimaryIcon = primary.icon;
  const primaryClass =
    "btn-press inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-forest-900 text-base font-bold text-cream-50 transition-colors hover:bg-forest-800";

  const headline =
    mode === "review"
      ? remaining === 0
        ? "틀린 문제를 모두 해결했어요!"
        : `${result.correct}문제를 새로 맞혔어요`
      : result.score === 100
        ? "완벽해요! 모든 문제를 맞혔어요"
        : result.score >= 70
          ? "훌륭해요! 조금만 더 하면 만점이에요"
          : "괜찮아요, 틀린 문제부터 다시 짚어봐요";

  return (
    <div className="mx-auto max-w-2xl animate-scale-in">
      <BackLink />
      <div className="card overflow-hidden">
        <div className="bg-forest-950 px-6 py-9 text-center text-cream-50">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-forest-800">
            <Trophy size={26} className={result.score === 100 ? "text-gold-300" : "text-cream-200"} />
          </span>
          <p className="text-sm text-cream-200/60">
            {quiz.title}
            {mode === "review" && " · 틀린 문제 복습"}
          </p>
          <p className="mt-2 font-display text-5xl font-semibold">
            {mode === "review" ? `${result.correct}/${result.total}` : result.score}
            {mode === "full" && <span className="text-2xl text-cream-200/50">점</span>}
          </p>
          <p className="mt-3 text-sm text-cream-200/80">{headline}</p>
        </div>

        <div className="p-5 md:p-6">
          {/* 문항별 결과 — 저장된 답안이 곧 취약 주제가 된다 */}
          <h2 className="text-base font-bold text-forest-950">문항별 결과</h2>
          <ul className="mt-2 divide-y divide-cream-100">
            {questions.map((q, i) => {
              const ok = picks[i] === q.answerIndex;
              return (
                <li key={q.id} className="flex items-start gap-3 py-3">
                  {ok ? (
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success" />
                  ) : (
                    <XCircle size={18} className="mt-0.5 shrink-0 text-danger" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-forest-950/50">{q.topic}</p>
                    <p className="text-sm text-forest-950/85">{q.question}</p>
                    {!ok && (
                      <p className="mt-1 text-xs text-forest-700">
                        정답 {OPTION_LABELS[q.answerIndex]}. {q.options[q.answerIndex]}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 rounded-xl bg-cream-100 px-4 py-3 text-sm text-forest-950/70">
            {wrongNow.length > 0
              ? `틀린 주제(${Array.from(new Set(wrongNow.map((q) => q.topic))).join(", ")})를 리포트의 취약 영역에 반영했어요.`
              : "리포트의 퀴즈 기록에 반영했어요."}
            {quizGoalDone && " 오늘의 목표 ‘퀴즈 1개 풀기’도 완료!"}
          </div>

          <div className="mt-5 space-y-3">
            {primary.href ? (
              <Link href={primary.href} className={primaryClass}>
                <PrimaryIcon size={18} />
                {primary.label}
              </Link>
            ) : (
              <button onClick={primary.onClick} className={primaryClass}>
                <PrimaryIcon size={18} />
                {primary.label}
              </button>
            )}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {mode === "review" ? (
                <Link
                  href={`/quiz/${quiz.id}`}
                  className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-forest-950/60 hover:text-forest-950"
                >
                  <RotateCcw size={15} />
                  전체 문제 다시 풀기
                </Link>
              ) : (
                <button
                  onClick={onRetry}
                  className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-forest-950/60 hover:text-forest-950"
                >
                  <RotateCcw size={15} />
                  처음부터 다시 풀기
                </button>
              )}
              <Link
                href="/report"
                className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-forest-950/60 hover:text-forest-950"
              >
                <BarChart3 size={15} />
                리포트에서 확인
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
