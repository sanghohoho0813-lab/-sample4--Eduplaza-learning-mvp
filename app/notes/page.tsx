"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  NotebookPen,
  Pencil,
  PlayCircle,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { COURSES, courseLessons, getCourse, getLesson } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { Header } from "@/components/Header";
import { ActivityTabs } from "@/components/ActivityTabs";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ListSkeleton } from "@/components/Skeletons";
import { CourseThumbnail } from "@/components/Thumbnail";

/** 올해 노트는 "10월 18일", 지난해 것은 연도까지 */
const noteDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR", {
    ...(d.getFullYear() !== new Date().getFullYear() && { year: "numeric" }),
    month: "long",
    day: "numeric",
  });
};

const mmss = (sec: number) =>
  `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

export default function NotesPage() {
  const store = useStore();
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [courseId, setCourseId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  /** 노트를 강의별로 모아 보기 — 비어 있으면 전체 */
  const [filter, setFilter] = useState("");

  if (!store.ready) {
    return (
      <div>
        <Header title="학습 활동" />
        <ListSkeleton rows={4} />
      </div>
    );
  }

  const enrolledCourses = store.state.enrollments
    .map((e) => COURSES.find((c) => c.id === e.courseId))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const selectedCourse = courseId ? getCourse(courseId) : undefined;

  const noteCourses = Array.from(new Set(store.state.notes.map((n) => n.courseId)))
    .map((id) => ({ course: getCourse(id), count: store.state.notes.filter((n) => n.courseId === id).length }))
    .filter((x): x is { course: NonNullable<ReturnType<typeof getCourse>>; count: number } => Boolean(x.course));
  // 고른 강의의 노트가 모두 지워지면 전체로 돌아간다
  const activeFilter = noteCourses.some((x) => x.course.id === filter) ? filter : "";
  const visibleNotes = activeFilter
    ? store.state.notes.filter((n) => n.courseId === activeFilter)
    : store.state.notes;

  const save = () => {
    const text = content.trim();
    if (!text || !courseId) return;
    store.addNote(courseId, lessonId || null, text);
    setContent("");
    setLessonId("");
    setFormOpen(false);
    toast("학습노트를 저장했어요");
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    store.deleteNote(deleteId);
    setDeleteId(null);
    toast("노트를 삭제했어요", "info");
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
      <Header title="학습 활동" />
      <ActivityTabs
        active="notes"
        counts={{ assignment: store.upcomingAssignments.length || undefined }}
      />

      <div className="mb-6">
        {!formOpen ? (
          <button
            onClick={() => {
              setFormOpen(true);
              // 기본값은 지금 듣고 있는 강의와 그 다음 레슨 — 대부분 방금 들은 내용을 적으니까
              if (!courseId && enrolledCourses.length > 0) {
                const cur = store.currentCourse() ?? enrolledCourses[0];
                setCourseId(cur.id);
                const last = store.state.enrollments.find((e) => e.courseId === cur.id)?.lastLessonId;
                if (last) setLessonId(last);
              }
            }}
            className="btn-press inline-flex min-h-[48px] items-center gap-2 rounded-full bg-forest-900 px-6 text-sm font-bold text-cream-50 transition-colors hover:bg-forest-800"
          >
            <Plus size={17} />새 노트 작성
          </button>
        ) : (
          <div className="card p-5 animate-scale-in md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-forest-950">
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
            {enrolledCourses.length === 0 ? (
              <div className="rounded-xl bg-cream-100 p-4 text-sm text-forest-950/72">
                노트는 수강 중인 강의에 연결해 남겨요. 먼저 강의를 시작해보세요.
                <Link href="/courses" className="ml-1 font-semibold text-forest-700 underline underline-offset-4">
                  강의 찾기
                </Link>
              </div>
            ) : (
            <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-forest-950/68">
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
                <span className="mb-1.5 block text-xs font-semibold text-forest-950/68">
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
            <label className="mt-3 block">
              <span className="sr-only">노트 내용</span>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
                }}
                rows={5}
                autoFocus
                placeholder="강의를 들으면서 중요한 내용을 기록해보세요."
                className="w-full resize-none rounded-xl border border-cream-200 bg-cream-50 p-3.5 text-sm outline-none placeholder:text-forest-950/35 focus:border-forest-400 focus:ring-2 focus:ring-forest-200"
              />
            </label>
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => setFormOpen(false)}
                className="btn-press min-h-[48px] rounded-full border border-cream-300 px-5 text-sm font-semibold text-forest-950/72"
              >
                취소
              </button>
              <button
                onClick={save}
                disabled={!content.trim() || !courseId}
                className="btn-press min-h-[48px] rounded-full bg-forest-900 px-6 text-sm font-bold text-cream-50 disabled:opacity-40"
              >
                저장하기
              </button>
            </div>
            </>
            )}
          </div>
        )}
      </div>

      {/* 여러 강의에 걸쳐 노트가 있으면 강의별로 골라 보기 */}
      {noteCourses.length > 1 && (
        <div className="thin-scroll -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="강의별 노트">
          <FilterPill active={!activeFilter} onClick={() => setFilter("")}>
            전체 <span className={!activeFilter ? "text-cream-200/80" : "text-forest-950/68"}>{store.state.notes.length}</span>
          </FilterPill>
          {noteCourses.map(({ course, count }) => (
            <FilterPill key={course.id} active={activeFilter === course.id} onClick={() => setFilter(course.id)}>
              <span className="max-w-[12rem] truncate">{course.title}</span>{" "}
              <span className={activeFilter === course.id ? "text-cream-200/80" : "text-forest-950/68"}>{count}</span>
            </FilterPill>
          ))}
        </div>
      )}

      {store.state.notes.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="아직 작성한 노트가 없어요"
          description="강의를 들으면서 중요한 내용을 기록해보세요."
          actionHref="/my-learning"
          actionLabel="학습하러 가기"
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {visibleNotes.map((note) => {
            const course = getCourse(note.courseId);
            const lessonInfo = note.lessonId ? getLesson(note.lessonId) : undefined;
            const isEditing = editingId === note.id;
            return (
              <li key={note.id} className="card flex flex-col p-5">
                <div className="mb-3 flex items-start gap-3">
                  {course && (
                    <Link href={`/courses/${note.courseId}`} className="w-14 shrink-0" tabIndex={-1} aria-hidden>
                      <CourseThumbnail
                        tone={course.thumbnailTone}
                        title={course.title}
                        courseId={course.id}
                        rounded="rounded-md"
                        sizes="56px"
                      />
                    </Link>
                  )}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/courses/${note.courseId}`}
                      className="block truncate text-sm font-semibold text-forest-950 hover:text-forest-600"
                    >
                      {course?.title}
                    </Link>
                    {lessonInfo ? (
                      <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-forest-950/68">
                        <PlayCircle size={13} className="shrink-0" aria-hidden />
                        <span className="truncate">{lessonInfo.lesson.title}</span>
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs text-forest-950/68">강의 전체 메모</p>
                    )}
                  </div>
                  {!isEditing && (
                    <div className="-mr-2 -mt-2 flex shrink-0">
                      <button
                        onClick={() => {
                          setEditingId(note.id);
                          setEditContent(note.content);
                        }}
                        className="btn-press flex h-10 w-10 items-center justify-center rounded-full text-forest-950/68 transition-colors hover:bg-cream-100 hover:text-forest-800"
                        aria-label="노트 수정"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteId(note.id)}
                        className="btn-press flex h-10 w-10 items-center justify-center rounded-full text-forest-950/68 transition-colors hover:bg-danger/10 hover:text-danger"
                        aria-label="노트 삭제"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="flex-1">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setEditingId(null);
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveEdit(note.id);
                      }}
                      aria-label="노트 내용 수정"
                      autoFocus
                      rows={5}
                      className="w-full resize-none rounded-xl border border-cream-200 bg-cream-50 p-3 text-sm outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-200"
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="btn-press min-h-[44px] rounded-full border border-cream-300 px-5 text-sm font-semibold text-forest-950/72"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => saveEdit(note.id)}
                        disabled={!editContent.trim()}
                        className="btn-press min-h-[44px] rounded-full bg-forest-900 px-5 text-sm font-bold text-cream-50 disabled:opacity-40"
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

                <div className="mt-3 flex min-h-[40px] flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-t border-cream-100 pt-2.5">
                  <p className="whitespace-nowrap text-xs text-forest-950/68">{noteDate(note.updatedAt)}</p>
                  {lessonInfo && !isEditing && (
                    <Link
                      href={`/learn/${note.courseId}?lesson=${lessonInfo.lesson.id}${typeof note.at === "number" ? `&t=${note.at}` : ""}`}
                      className="btn-press inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full bg-forest-50 px-3.5 text-xs font-semibold text-forest-800 transition-colors hover:bg-forest-100"
                    >
                      <PlayCircle size={14} aria-hidden />
                      {typeof note.at === "number" ? `${mmss(note.at)}부터 다시 보기` : "레슨 다시 보기"}
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="이 노트를 삭제할까요?"
        description="삭제한 노트는 되돌릴 수 없어요."
        confirmLabel="삭제"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        "btn-press inline-flex min-h-[40px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors",
        active
          ? "border-forest-900 bg-forest-900 text-cream-50"
          : "border-cream-300 bg-white text-forest-950/72 hover:border-forest-300"
      )}
    >
      {children}
    </button>
  );
}
