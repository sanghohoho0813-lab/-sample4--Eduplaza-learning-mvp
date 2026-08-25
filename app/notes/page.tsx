"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  BookOpen,
  NotebookPen,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { COURSES, courseLessons, getCourse, getLesson } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { Header } from "@/components/Header";
import { EmptyState } from "@/components/EmptyState";
import { ListSkeleton } from "@/components/Skeletons";

export default function NotesPage() {
  const store = useStore();
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [courseId, setCourseId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  if (!store.ready) {
    return (
      <div>
        <Header title="학습노트" />
        <ListSkeleton rows={4} />
      </div>
    );
  }

  const enrolledCourses = store.state.enrollments
    .map((e) => COURSES.find((c) => c.id === e.courseId))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const selectedCourse = courseId ? getCourse(courseId) : undefined;

  const save = () => {
    const text = content.trim();
    if (!text || !courseId) return;
    store.addNote(courseId, lessonId || null, text);
    setContent("");
    setLessonId("");
    setFormOpen(false);
    toast("학습노트를 저장했어요 ✍️");
  };

  const saveEdit = (id: string) => {
    const text = editContent.trim();
    if (!text) return;
    store.updateNote(id, text);
    setEditingId(null);
    toast("노트를 수정했어요");
  };

  return (
    <div className="animate-fade-up">
      <Header
        title="학습노트"
        subtitle="배운 것을 내 언어로 정리하면 온전히 내 것이 돼요."
      />

      <div className="mb-6">
        {!formOpen ? (
          <button
            onClick={() => {
              setFormOpen(true);
              if (!courseId && enrolledCourses.length > 0)
                setCourseId(enrolledCourses[0].id);
            }}
            className="btn-press inline-flex min-h-[48px] items-center gap-2 rounded-full bg-forest-900 px-6 text-sm font-bold text-cream-50 transition-colors hover:bg-forest-800"
          >
            <Plus size={17} />새 노트 작성
          </button>
        ) : (
          <div className="card p-5 animate-scale-in md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[22px] font-bold text-forest-950">
                새 노트 작성
              </h3>
              <button
                onClick={() => setFormOpen(false)}
                className="btn-press flex h-9 w-9 items-center justify-center rounded-full bg-cream-100 text-forest-800"
                aria-label="닫기"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-forest-950/55">
                  강의 선택
                </span>
                <select
                  value={courseId}
                  onChange={(e) => {
                    setCourseId(e.target.value);
                    setLessonId("");
                  }}
                  className="min-h-[46px] w-full rounded-xl border border-cream-200 bg-cream-50 px-3.5 text-sm outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-200"
                >
                  {enrolledCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-forest-950/55">
                  레슨 연결 (선택)
                </span>
                <select
                  value={lessonId}
                  onChange={(e) => setLessonId(e.target.value)}
                  className="min-h-[46px] w-full rounded-xl border border-cream-200 bg-cream-50 px-3.5 text-sm outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-200"
                >
                  <option value="">연결 안 함</option>
                  {selectedCourse &&
                    courseLessons(selectedCourse).map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title}
                      </option>
                    ))}
                </select>
              </label>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="강의를 들으면서 중요한 내용을 기록해보세요."
              className="mt-3 w-full resize-none rounded-xl border border-cream-200 bg-cream-50 p-3.5 text-sm outline-none placeholder:text-forest-950/35 focus:border-forest-400 focus:ring-2 focus:ring-forest-200"
            />
            <div className="mt-3 flex justify-end">
              <button
                onClick={save}
                disabled={!content.trim() || !courseId}
                className="btn-press rounded-full bg-forest-900 px-6 py-2.5 text-sm font-bold text-cream-50 disabled:opacity-40"
              >
                저장하기
              </button>
            </div>
          </div>
        )}
      </div>

      {store.state.notes.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="아직 작성한 노트가 없어요"
          description="강의를 들으면서 중요한 내용을 기록해보세요."
          actionHref="/my-learning"
          actionLabel="학습하러 가기"
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {store.state.notes.map((note) => {
            const course = getCourse(note.courseId);
            const lessonInfo = note.lessonId ? getLesson(note.lessonId) : undefined;
            const isEditing = editingId === note.id;
            return (
              <li key={note.id} className="card flex flex-col p-5">
                <div className="mb-2.5 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/courses/${note.courseId}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest-600 hover:text-forest-800"
                    >
                      <BookOpen size={13} />
                      <span className="truncate">{course?.title}</span>
                    </Link>
                    {lessonInfo && (
                      <p className="mt-0.5 truncate text-xs text-forest-950/45">
                        📍 {lessonInfo.lesson.title}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => {
                        setEditingId(note.id);
                        setEditContent(note.content);
                      }}
                      className="btn-press flex h-8 w-8 items-center justify-center rounded-full text-forest-950/40 transition-colors hover:bg-cream-100 hover:text-forest-800"
                      aria-label="노트 수정"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => {
                        store.deleteNote(note.id);
                        toast("노트를 삭제했어요", "info");
                      }}
                      className="btn-press flex h-8 w-8 items-center justify-center rounded-full text-forest-950/40 transition-colors hover:bg-danger/10 hover:text-danger"
                      aria-label="노트 삭제"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="flex-1">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={5}
                      className="w-full resize-none rounded-xl border border-cream-200 bg-cream-50 p-3 text-sm outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-200"
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="btn-press rounded-full border border-cream-300 px-4 py-2 text-xs font-semibold text-forest-950/60"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => saveEdit(note.id)}
                        className="btn-press rounded-full bg-forest-900 px-4 py-2 text-xs font-bold text-cream-50"
                      >
                        저장
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="flex-1 whitespace-pre-wrap text-sm leading-relaxed text-forest-950/80">
                    {note.content}
                  </p>
                )}

                <p
                  className={clsx(
                    "mt-3 border-t border-cream-100 pt-2.5 text-xs text-forest-950/40"
                  )}
                >
                  {new Date(note.updatedAt).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
