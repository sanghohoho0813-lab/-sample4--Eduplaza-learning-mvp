"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  PenSquare,
  PlayCircle,
  RotateCcw,
  Send,
} from "lucide-react";
import { ASSIGNMENTS, QUIZZES, getCourse } from "@/lib/data";
import { daysUntil, dueLabel, useStore } from "@/lib/store";
import { groupWeak } from "@/lib/insights";
import { useToast } from "@/components/Toast";
import { Header } from "@/components/Header";
import { ActivityTabs } from "@/components/ActivityTabs";
import { ListSkeleton } from "@/components/Skeletons";

export default function QuizListPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={4} />}>
      <QuizList />
    </Suspense>
  );
}

function QuizList() {
  const store = useStore();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "assignment" ? "assignment" : "quiz";

  if (!store.ready) {
    return (
      <div>
        <Header title="학습 활동" />
        <ListSkeleton rows={4} />
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <Header
        title="학습 활동"
        subtitle={
          tab === "quiz"
            ? "배운 내용을 퀴즈로 점검하고, 틀린 문제는 다시 풀어보세요."
            : "과제로 배운 내용을 내 것으로 만들어보세요."
        }
      />
      <ActivityTabs
        active={tab}
        counts={{ assignment: store.upcomingAssignments.length || undefined }}
      />
      {tab === "quiz" ? <QuizTab /> : <AssignmentTab />}
    </div>
  );
}

function QuizTab() {
  const store = useStore();
  const weak = groupWeak(store.weakQuestions);
  const weakCount = store.weakQuestions.length;

  return (
    <div className="space-y-6">
      {weakCount > 0 && (
        <section className="card p-5 md:p-6" aria-labelledby="weak-heading">
          <div className="mb-1 flex items-center gap-2">
            <RotateCcw size={18} className="text-forest-600" />
            <h2 id="weak-heading" className="text-base font-bold text-forest-950">
              다시 풀어볼 문제 {weakCount}개
            </h2>
          </div>
          <p className="text-sm text-forest-950/55">
            틀린 문제만 골라 풀어요. 맞히면 취약 영역에서 사라져요.
          </p>
          <ul className="mt-3 divide-y divide-cream-100">
            {weak.map((g) => (
              <li key={g.quiz.id}>
                <Link
                  href={`/quiz/${g.quiz.id}?mode=review`}
                  className="group flex min-h-[60px] items-center gap-3 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-forest-950">{g.quiz.title}</p>
                    <p className="truncate text-xs text-forest-950/50">{g.topics.join(" · ")}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-forest-50 px-2.5 py-1 text-xs font-semibold text-forest-700">
                    {g.count}문제
                  </span>
                  <ChevronRight
                    size={18}
                    className="shrink-0 text-forest-950/30 transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {QUIZZES.map((quiz) => {
          const course = getCourse(quiz.courseId);
          const best = store.bestScore(quiz.id);
          const wrong = store.weakQuestions.filter((w) => w.quizId === quiz.id).length;
          return (
            <Link
              key={quiz.id}
              href={`/quiz/${quiz.id}`}
              className="card group flex flex-col p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
            >
              <p className="truncate text-xs font-medium text-forest-950/50">{course?.title}</p>
              <h3 className="mt-1.5 font-display text-lg font-semibold text-forest-950 transition-colors group-hover:text-forest-600">
                {quiz.title}
              </h3>
              <p className="mt-1.5 flex-1 text-sm text-forest-950/55">{quiz.description}</p>
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-cream-100 pt-3.5">
                <span className="text-xs text-forest-950/50">
                  {quiz.questions.length}문항
                  {wrong > 0 && ` · 틀린 문제 ${wrong}개`}
                </span>
                {best !== null ? (
                  <span
                    className={clsx(
                      "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                      best === 100 ? "bg-gold-300/25 text-gold-600" : "bg-forest-50 text-forest-700"
                    )}
                  >
                    최고 {best}점
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-forest-600">
                    도전하기 <ChevronRight size={14} />
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function AssignmentTab() {
  const store = useStore();
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [openForm, setOpenForm] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);

  // 홈의 "곧 마감"에서 넘어오면(#과제id) 해당 과제로 스크롤하고 잠시 강조한다.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setFocus(id);
    const t = setTimeout(() => setFocus(null), 2400);
    return () => clearTimeout(t);
  }, []);

  const pending = store.upcomingAssignments;
  const rest = ASSIGNMENTS.filter((a) => !pending.some((p) => p.assignment.id === a.id));
  const ordered = [...pending.map((p) => p.assignment), ...rest];

  const current = store.currentCourse();
  const next = current ? store.nextLesson(current.id) : null;

  const submit = (id: string) => {
    const text = (drafts[id] ?? "").trim();
    if (!text) return;
    store.submitAssignment(id, text);
    setOpenForm(null);
    setJustSubmitted(id);
    toast("과제를 제출했어요. 캘린더와 리포트에 반영했어요.", "celebrate");
  };

  return (
    <div className="space-y-4">
      {ordered.map((assignment) => {
        const course = getCourse(assignment.courseId);
        const submission = store.state.assignments[assignment.id];
        const status = store.assignmentStatus(assignment.id);
        const due = store.assignmentDue(assignment.id);
        const dLeft = daysUntil(due);
        const formOpen = openForm === assignment.id;
        // 제출 직후에 보여줄 다음 과제 (방금 낸 것 제외)
        const nextPending = pending.find((p) => p.assignment.id !== assignment.id);

        return (
          <article
            key={assignment.id}
            id={assignment.id}
            className={clsx(
              "card scroll-mt-24 p-5 transition-shadow duration-500 md:p-6",
              focus === assignment.id && "ring-2 ring-forest-400"
            )}
          >
            {/* 모바일에서는 마감 표시를 위로 올려 본문이 전체 폭을 쓰게 한다 */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-forest-950/50">{course?.title}</p>
                <h3 className="mt-1 text-base font-bold text-forest-950">{assignment.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-forest-950/60">
                  {assignment.description}
                </p>
              </div>
              <div className="order-first flex shrink-0 flex-wrap items-center gap-x-2.5 gap-y-1 sm:order-none sm:flex-col sm:items-end sm:gap-1.5">
                {status === "submitted" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-forest-50 px-2.5 py-1 text-xs font-semibold text-success">
                    <CheckCircle2 size={13} /> 제출 완료
                  </span>
                ) : (
                  <span
                    className={clsx(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                      dLeft < 0
                        ? "bg-danger/10 text-danger"
                        : dLeft <= 1
                          ? "bg-amber-50 text-amber-600"
                          : "bg-cream-100 text-forest-950/60"
                    )}
                  >
                    <CalendarClock size={13} />
                    {dueLabel(dLeft)}
                  </span>
                )}
                <span className="text-xs text-forest-950/40">마감 {due}</span>
              </div>
            </div>

            {status === "submitted" && submission ? (
              <>
                <div className="mt-4 rounded-xl border border-forest-100 bg-forest-50 p-4">
                  <p className="text-xs font-bold text-forest-700">
                    제출한 내용
                    {submission.submittedAt &&
                      ` · ${new Date(submission.submittedAt).toLocaleDateString("ko-KR")}`}
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-forest-950/75">
                    {submission.text}
                  </p>
                </div>
                {justSubmitted === assignment.id && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-forest-200 bg-white p-4 animate-scale-in">
                    <p className="text-sm text-forest-950/70">
                      {nextPending
                        ? `다음 과제도 ${dueLabel(nextPending.dLeft)}예요.`
                        : "남은 과제가 없어요. 이어서 학습해볼까요?"}
                    </p>
                    {nextPending ? (
                      <a
                        href={`#${nextPending.assignment.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          document
                            .getElementById(nextPending.assignment.id)
                            ?.scrollIntoView({ behavior: "smooth", block: "center" });
                          setFocus(nextPending.assignment.id);
                          setTimeout(() => setFocus(null), 2400);
                        }}
                        className="btn-press inline-flex min-h-[48px] items-center gap-1.5 rounded-full bg-forest-900 px-5 text-sm font-bold text-cream-50"
                      >
                        다음 과제 보기 <ChevronRight size={15} />
                      </a>
                    ) : (
                      <Link
                        href={current && next ? `/learn/${current.id}?lesson=${next.id}` : "/courses"}
                        className="btn-press inline-flex min-h-[48px] items-center gap-1.5 rounded-full bg-forest-900 px-5 text-sm font-bold text-cream-50"
                      >
                        <PlayCircle size={16} /> 이어서 학습하기
                      </Link>
                    )}
                  </div>
                )}
              </>
            ) : formOpen ? (
              <div className="mt-4 animate-scale-in">
                <label htmlFor={`draft-${assignment.id}`} className="sr-only">
                  과제 내용
                </label>
                <textarea
                  id={`draft-${assignment.id}`}
                  value={drafts[assignment.id] ?? ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [assignment.id]: e.target.value }))}
                  rows={4}
                  placeholder="과제 내용을 작성해주세요."
                  className="w-full resize-none rounded-xl border border-cream-200 bg-cream-50 p-3.5 text-sm outline-none placeholder:text-forest-950/35 focus:border-forest-400 focus:ring-2 focus:ring-forest-200"
                />
                <div className="mt-2.5 flex justify-end gap-2">
                  <button
                    onClick={() => setOpenForm(null)}
                    className="btn-press min-h-[48px] rounded-full border border-cream-300 px-5 text-sm font-semibold text-forest-950/60"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => submit(assignment.id)}
                    disabled={!(drafts[assignment.id] ?? "").trim()}
                    className="btn-press inline-flex min-h-[48px] items-center gap-1.5 rounded-full bg-forest-900 px-5 text-sm font-bold text-cream-50 disabled:opacity-40"
                  >
                    <Send size={14} />
                    제출하기
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setOpenForm(assignment.id)}
                className="btn-press mt-4 inline-flex min-h-[48px] items-center gap-1.5 rounded-full border border-forest-200 px-5 text-sm font-semibold text-forest-800 transition-colors hover:border-forest-400 hover:bg-forest-50"
              >
                <PenSquare size={15} />
                과제 작성하기
              </button>
            )}
          </article>
        );
      })}
    </div>
  );
}
