"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  PenSquare,
  Send,
} from "lucide-react";
import { ASSIGNMENTS, QUIZZES, getCourse } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { Header } from "@/components/Header";
import { ListSkeleton } from "@/components/Skeletons";

export default function QuizListPage() {
  const store = useStore();
  const { toast } = useToast();
  const [tab, setTab] = useState<"quiz" | "assignment">("quiz");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [openForm, setOpenForm] = useState<string | null>(null);

  if (!store.ready) {
    return (
      <div>
        <Header title="퀴즈 · 과제" />
        <ListSkeleton rows={4} />
      </div>
    );
  }

  const bestScore = (quizId: string) => {
    const results = store.state.quizResults.filter((r) => r.quizId === quizId);
    if (results.length === 0) return null;
    return Math.max(...results.map((r) => r.score));
  };

  const submit = (id: string) => {
    const text = (drafts[id] ?? "").trim();
    if (!text) return;
    store.submitAssignment(id, text);
    setOpenForm(null);
    toast("과제를 제출했어요! 수고하셨어요 📝", "celebrate");
  };

  return (
    <div className="animate-fade-up">
      <Header
        title="퀴즈 · 과제"
        subtitle="배운 내용을 점검하고 과제로 마무리해보세요."
      />

      <div className="mb-6 inline-flex rounded-full bg-cream-200 p-1">
        {(
          [
            ["quiz", "퀴즈", PenSquare],
            ["assignment", "과제", ClipboardList],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={clsx(
              "btn-press inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-5 text-sm font-bold transition-colors",
              tab === key ? "bg-forest-950 text-cream-50" : "text-forest-950/55"
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {tab === "quiz" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {QUIZZES.map((quiz) => {
            const course = getCourse(quiz.courseId);
            const best = bestScore(quiz.id);
            return (
              <Link
                key={quiz.id}
                href={`/quiz/${quiz.id}`}
                className="card group flex flex-col p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
              >
                <p className="text-xs font-medium text-forest-950/45">
                  {course?.title}
                </p>
                <h3 className="mt-1.5 font-display text-lg font-semibold text-forest-950 transition-colors group-hover:text-forest-600">
                  {quiz.title}
                </h3>
                <p className="mt-1.5 flex-1 text-sm text-forest-950/55">
                  {quiz.description}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-cream-100 pt-3.5">
                  <span className="text-xs text-forest-950/45">
                    {quiz.questions.length}문항
                  </span>
                  {best !== null ? (
                    <span
                      className={clsx(
                        "chip",
                        best === 100
                          ? "bg-gold-300/25 text-gold-600"
                          : best >= 70
                            ? "bg-forest-100 text-forest-700"
                            : "bg-cream-100 text-forest-950/50"
                      )}
                    >
                      최고 {best}점 {best === 100 && "🏆"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-sm font-semibold text-forest-600">
                      도전하기 <ChevronRight size={14} />
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {ASSIGNMENTS.map((assignment) => {
            const course = getCourse(assignment.courseId);
            const submission = store.state.assignments[assignment.id];
            const status = store.assignmentStatus(assignment.id);
            const due = new Date(assignment.dueDate + "T23:59:59");
            const dLeft = Math.ceil(
              (due.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            const formOpen = openForm === assignment.id;
            return (
              <div key={assignment.id} className="card p-5 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-forest-950/45">
                      {course?.title}
                    </p>
                    <h3 className="mt-1 text-[16px] font-bold text-forest-950">
                      {assignment.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-forest-950/60">
                      {assignment.description}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    {status === "submitted" ? (
                      <span className="chip bg-forest-100 text-success">
                        <CheckCircle2 size={13} /> 제출 완료
                      </span>
                    ) : (
                      <span
                        className={clsx(
                          "chip",
                          dLeft <= 1
                            ? "bg-danger/10 text-danger"
                            : "bg-cream-100 text-forest-950/55"
                        )}
                      >
                        <CalendarClock size={13} />
                        {dLeft < 0
                          ? "마감됨"
                          : dLeft === 0
                            ? "오늘 마감"
                            : `${dLeft}일 남음`}
                      </span>
                    )}
                    <span className="text-xs text-forest-950/40">
                      마감 {assignment.dueDate}
                    </span>
                  </div>
                </div>

                {status === "submitted" && submission ? (
                  <div className="mt-4 rounded-xl border border-forest-100 bg-forest-50 p-4">
                    <p className="text-xs font-bold text-forest-700">
                      제출한 내용
                    </p>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-forest-950/75">
                      {submission.text}
                    </p>
                  </div>
                ) : formOpen ? (
                  <div className="mt-4 animate-scale-in">
                    <textarea
                      value={drafts[assignment.id] ?? ""}
                      onChange={(e) =>
                        setDrafts((d) => ({
                          ...d,
                          [assignment.id]: e.target.value,
                        }))
                      }
                      rows={4}
                      placeholder="과제 내용을 작성해주세요."
                      className="w-full resize-none rounded-xl border border-cream-200 bg-cream-50 p-3.5 text-sm outline-none placeholder:text-forest-950/35 focus:border-forest-400 focus:ring-2 focus:ring-forest-200"
                    />
                    <div className="mt-2.5 flex justify-end gap-2">
                      <button
                        onClick={() => setOpenForm(null)}
                        className="btn-press rounded-full border border-cream-300 px-4 py-2.5 text-sm font-semibold text-forest-950/60"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => submit(assignment.id)}
                        disabled={!(drafts[assignment.id] ?? "").trim()}
                        className="btn-press inline-flex items-center gap-1.5 rounded-full bg-forest-900 px-5 py-2.5 text-sm font-bold text-cream-50 disabled:opacity-40"
                      >
                        <Send size={14} />
                        제출하기
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setOpenForm(assignment.id)}
                    className="btn-press mt-4 inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-forest-900 px-5 text-sm font-bold text-cream-50 hover:bg-forest-800"
                  >
                    <PenSquare size={15} />
                    과제 작성하기
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
