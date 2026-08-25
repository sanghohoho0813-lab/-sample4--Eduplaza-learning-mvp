"use client";

import { useCallback, useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  RotateCcw,
  Trophy,
  X,
  XCircle,
} from "lucide-react";
import { QUIZZES, getCourse } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { ProgressBar } from "@/components/ProgressBar";

const OPTION_LABELS = ["A", "B", "C", "D"];

export default function QuizPlayPage() {
  const params = useParams<{ id: string }>();
  const quiz = QUIZZES.find((q) => q.id === params.id);
  const store = useStore();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);

  const question = quiz?.questions[step];
  const correctCount = answers.filter(Boolean).length;

  const checkAnswer = useCallback(() => {
    if (selected === null || !question) return;
    setChecked(true);
    setAnswers((a) => [...a, selected === question.answerIndex]);
  }, [selected, question]);

  const nextQuestion = useCallback(() => {
    if (!quiz) return;
    if (step + 1 >= quiz.questions.length) {
      const total = quiz.questions.length;
      const finalCorrect = answers.filter(Boolean).length;
      const result = store.saveQuizResult(quiz.id, finalCorrect, total);
      setFinished(true);
      if (result.score === 100) {
        toast("퍼펙트 스코어! 정말 대단해요 🏆", "celebrate");
      } else {
        toast("퀴즈 결과를 저장했어요. 리포트에 반영됩니다.", "success");
      }
    } else {
      setStep((s) => s + 1);
      setSelected(null);
      setChecked(false);
    }
  }, [quiz, step, answers, store, toast]);

  // 키보드 단축키: 1~4로 보기 선택, Enter로 정답 확인 / 다음 문제
  useEffect(() => {
    if (finished || !question) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;

      const num = Number(e.key);
      if (!checked && num >= 1 && num <= question.options.length) {
        e.preventDefault();
        setSelected(num - 1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (checked) nextQuestion();
        else checkAnswer();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finished, question, checked, checkAnswer, nextQuestion]);

  if (!quiz || !question) return notFound();
  const course = getCourse(quiz.courseId);

  const retry = () => {
    setStep(0);
    setSelected(null);
    setChecked(false);
    setAnswers([]);
    setFinished(false);
  };

  // ---- 결과 화면 ----
  if (finished) {
    const total = quiz.questions.length;
    const score = Math.round((correctCount / total) * 100);
    return (
      <div className="mx-auto max-w-xl animate-scale-in">
        <div className="card overflow-hidden">
          <div className="bg-forest-950 px-6 py-10 text-center text-cream-50">
            <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-forest-800">
              <Trophy
                size={28}
                className={score === 100 ? "text-gold-300" : "text-cream-200"}
              />
            </span>
            <p className="text-sm text-cream-200/60">{quiz.title}</p>
            <p className="mt-2 font-display text-5xl font-semibold">
              {score}
              <span className="text-2xl text-cream-200/50">점</span>
            </p>
            <p className="mt-3 text-sm text-cream-200/75">
              {score === 100
                ? "완벽해요! 모든 문제를 맞혔어요 🎉"
                : score >= 70
                  ? "훌륭해요! 조금만 더 하면 만점이에요."
                  : "괜찮아요, 다시 풀며 개념을 다져봐요."}
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-forest-50 p-4 text-center">
                <p className="text-xs text-forest-950/50">정답</p>
                <p className="mt-1 font-display text-xl font-semibold text-success">
                  {correctCount}개
                </p>
              </div>
              <div className="rounded-xl bg-cream-100 p-4 text-center">
                <p className="text-xs text-forest-950/50">오답</p>
                <p className="mt-1 font-display text-xl font-semibold text-danger">
                  {total - correctCount}개
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              <button
                onClick={retry}
                className="btn-press inline-flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-full border border-cream-300 text-sm font-bold text-forest-950"
              >
                <RotateCcw size={15} />
                다시 풀기
              </button>
              <Link
                href="/report"
                className="btn-press inline-flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-full bg-forest-900 text-sm font-bold text-cream-50"
              >
                리포트에서 확인
                <ArrowRight size={15} />
              </Link>
            </div>
            <Link
              href="/quiz"
              className="mt-3 block text-center text-sm font-semibold text-forest-600 hover:text-forest-800"
            >
              다른 퀴즈 보러 가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---- 문제 풀이 화면 ----
  return (
    <div className="mx-auto max-w-2xl animate-fade-up">
      <Link
        href="/quiz"
        className="btn-press mb-4 inline-flex items-center gap-1 text-sm font-semibold text-forest-950/55 hover:text-forest-950"
      >
        <ChevronLeft size={16} />
        퀴즈 목록
      </Link>

      <div className="mb-5">
        <p className="text-xs font-medium text-forest-950/45">{course?.title}</p>
        <h1 className="mt-1 font-display text-xl font-semibold text-forest-950 md:text-2xl">
          {quiz.title}
        </h1>
        <div className="mt-4 flex items-center gap-3">
          <ProgressBar
            value={((step + (checked ? 1 : 0)) / quiz.questions.length) * 100}
            fillClass="bg-forest-600"
            animate={false}
          />
          <span className="shrink-0 text-sm font-bold text-forest-700">
            {step + 1}/{quiz.questions.length}
          </span>
        </div>
        {/* 문항별 진행 도트 */}
        <div className="mt-3 flex items-center gap-1.5" aria-hidden>
          {quiz.questions.map((qq, i) => (
            <span
              key={qq.id}
              className={clsx(
                "h-2.5 rounded-full transition-all duration-300",
                i < answers.length
                  ? answers[i]
                    ? "w-2.5 bg-success"
                    : "w-2.5 bg-danger"
                  : i === step
                    ? "w-6 bg-forest-800"
                    : "w-2.5 bg-cream-300"
              )}
            />
          ))}
        </div>
      </div>

      <div className="card p-5 md:p-7">
        <p className="text-[16px] font-bold uppercase tracking-widest text-forest-500">
          Question {step + 1}
        </p>
        <h2 className="mt-2 text-[25px] font-bold leading-relaxed text-forest-950 md:text-lg">
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
                className={clsx(
                  "flex min-h-[56px] w-full items-center gap-3.5 rounded-2xl border-2 px-4 py-3 text-left text-sm transition-all duration-200 md:text-[22px]",
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
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[19px] font-bold transition-colors",
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
              selected === question.answerIndex
                ? "bg-forest-50"
                : "bg-cream-100"
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

        {/* 키보드 단축키 힌트 (데스크톱) */}
        <p className="mt-4 hidden items-center justify-center gap-2 text-xs text-forest-950/40 md:flex">
          <kbd className="rounded border border-cream-300 bg-cream-50 px-1.5 py-0.5 font-sans text-[16px] font-semibold">
            1
          </kbd>
          ~
          <kbd className="rounded border border-cream-300 bg-cream-50 px-1.5 py-0.5 font-sans text-[16px] font-semibold">
            {question.options.length}
          </kbd>
          보기 선택 ·
          <kbd className="rounded border border-cream-300 bg-cream-50 px-1.5 py-0.5 font-sans text-[16px] font-semibold">
            Enter
          </kbd>
          {checked ? "다음 문제" : "정답 확인"}
        </p>

        <div className="mt-4">
          {!checked ? (
            <button
              onClick={checkAnswer}
              disabled={selected === null}
              className="btn-press min-h-[52px] w-full rounded-full bg-forest-900 text-[22px] font-bold text-cream-50 transition-colors hover:bg-forest-800 disabled:opacity-40"
            >
              정답 확인
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              className="btn-press inline-flex min-h-[52px] w-full items-center justify-center gap-1.5 rounded-full bg-forest-900 text-[22px] font-bold text-cream-50 transition-colors hover:bg-forest-800"
            >
              {step + 1 >= quiz.questions.length ? "결과 보기" : "다음 문제"}
              <ArrowRight size={17} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
