"use client";

import { useMemo, useState } from "react";
import { notFound, useParams, useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import {
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Circle,
  Clock,
  Heart,
  ListChecks,
  PlayCircle,
  Star,
  Users,
} from "lucide-react";
import {
  LEVEL_LABEL,
  courseLessons,
  courseReviews,
  formatMinutes,
  formatPrice,
  getCategory,
  getCourse,
  getInstructor,
} from "@/lib/data";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { CourseThumbnail, InstructorAvatar } from "@/components/Thumbnail";
import { ProgressBar } from "@/components/ProgressBar";

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const course = getCourse(params.id);
  const store = useStore();
  const { toast } = useToast();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [enrolling, setEnrolling] = useState(false);

  const reviews = useMemo(
    () => (course ? courseReviews(course.id) : []),
    [course]
  );

  if (!course) return notFound();

  const instructor = getInstructor(course.instructorId);
  const enrolled = store.isEnrolled(course.id);
  const pct = store.courseProgress(course.id);
  const next = store.nextLesson(course.id);
  const fav = store.isFavorite(course.id);
  const lessonCount = courseLessons(course).length;

  const handleEnroll = () => {
    if (enrolled) {
      router.push(
        next
          ? `/learn/${course.id}?lesson=${next.id}`
          : `/learn/${course.id}`
      );
      return;
    }
    setEnrolling(true);
    store.enroll(course.id);
    toast("수강 신청이 완료됐어요! 바로 학습을 시작해볼까요? 🎉", "celebrate");
    const first = courseLessons(course)[0];
    setTimeout(() => {
      router.push(`/learn/${course.id}?lesson=${first.id}`);
    }, 900);
  };

  const toggleSection = (id: string) =>
    setOpenSections((s) => ({ ...s, [id]: !(s[id] ?? true) }));

  return (
    <>
      <div className="animate-fade-up">
      <button
        onClick={() => router.back()}
        className="btn-press mb-4 inline-flex items-center gap-1 text-sm font-semibold text-forest-950/55 hover:text-forest-950"
      >
        <ChevronLeft size={16} />
        돌아가기
      </button>

      {/* 히어로 */}
      <section className="relative overflow-hidden rounded-2xl bg-forest-950 p-6 text-cream-50 shadow-card md:p-8">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-forest-600/25 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr,360px] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip bg-forest-800 text-cream-100">
                {getCategory(course.categoryId)?.name}
              </span>
              <span className="chip border border-cream-200/20 text-cream-200">
                {LEVEL_LABEL[course.level]}
              </span>
            </div>
            <h1 className="mt-3 font-display text-2xl font-semibold leading-snug md:text-3xl">
              {course.title}
            </h1>
            <p className="mt-2 text-sm text-cream-200/75 md:text-[22px]">
              {course.subtitle}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-cream-200/80">
              <span className="inline-flex items-center gap-1.5">
                <Star size={15} className="fill-gold-300 text-gold-300" />
                <b className="text-cream-50">{course.rating.toFixed(1)}</b>
                <span className="text-cream-200/50">
                  (수강평 {course.reviewCount})
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users size={15} />
                {course.studentCount.toLocaleString()}명 수강
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={15} />총 {formatMinutes(course.totalMinutes)} ·{" "}
                {lessonCount}개 레슨
              </span>
            </div>

            {enrolled && (
              <div className="mt-5 max-w-sm">
                <div className="mb-1.5 flex justify-between text-xs text-cream-200/70">
                  <span>내 진도율</span>
                  <span className="font-bold text-cream-50">{pct}%</span>
                </div>
                <ProgressBar
                  value={pct}
                  trackClass="bg-forest-800"
                  fillClass="bg-gradient-to-r from-cream-300 to-gold-300"
                />
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="btn-press inline-flex min-h-[48px] items-center gap-2 rounded-full bg-cream-100 px-7 py-3 text-[22px] font-bold text-forest-950 transition-colors hover:bg-cream-50 disabled:opacity-70"
              >
                <PlayCircle size={19} />
                {enrolling
                  ? "수강 등록 중..."
                  : enrolled
                    ? pct > 0
                      ? "강의 이어보기"
                      : "학습 시작하기"
                    : "수강 시작하기"}
              </button>
              <button
                onClick={() => {
                  store.toggleFavorite(course.id);
                  toast(fav ? "찜 목록에서 제거했어요" : "찜 목록에 저장했어요 ♥");
                }}
                className={clsx(
                  "btn-press inline-flex min-h-[48px] items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition-colors",
                  fav
                    ? "border-gold-300/60 bg-forest-900 text-gold-300"
                    : "border-cream-200/25 text-cream-100 hover:bg-forest-800"
                )}
              >
                <Heart size={17} className={clsx(fav && "fill-gold-300")} />
                {fav ? "찜 완료" : "찜하기"}
              </button>
              <span className="ml-1 font-display text-xl font-semibold">
                {enrolled ? "수강 중" : formatPrice(course.price)}
              </span>
            </div>
          </div>

          <div className="hidden lg:block">
            <CourseThumbnail
              tone={course.thumbnailTone}
              title={course.title}
              className="ring-1 ring-cream-50/10"
            />
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr),320px]">
        <div className="min-w-0 space-y-8">
          {/* 소개 */}
          <section className="card p-6">
            <h2 className="mb-3 text-lg font-bold text-forest-950">강의 소개</h2>
            <p className="text-[22px] leading-relaxed text-forest-950/75">
              {course.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {course.tags.map((t) => (
                <span key={t} className="chip bg-cream-100 text-forest-700">
                  #{t}
                </span>
              ))}
            </div>
          </section>

          {/* 커리큘럼 */}
          <section className="card p-6">
            <h2 className="mb-1 text-lg font-bold text-forest-950">커리큘럼</h2>
            <p className="mb-4 text-sm text-forest-950/50">
              {course.sections.length}개 섹션 · {lessonCount}개 레슨 · 총{" "}
              {formatMinutes(course.totalMinutes)}
            </p>
            <div className="space-y-3">
              {course.sections.map((section) => {
                const open = openSections[section.id] ?? true;
                return (
                  <div
                    key={section.id}
                    className="overflow-hidden rounded-xl border border-cream-200"
                  >
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="flex min-h-[52px] w-full items-center justify-between gap-3 bg-cream-50 px-4 py-3 text-left"
                    >
                      <span className="text-sm font-bold text-forest-950">
                        Section {section.order}. {section.title}
                      </span>
                      <ChevronDown
                        size={17}
                        className={clsx(
                          "shrink-0 text-forest-950/40 transition-transform duration-200",
                          open && "rotate-180"
                        )}
                      />
                    </button>
                    {open && (
                      <ul className="divide-y divide-cream-100">
                        {section.lessons.map((lesson) => {
                          const status = store.lessonStatus(lesson.id);
                          const inner = (
                            <>
                              {status === "completed" ? (
                                <CheckCircle2
                                  size={17}
                                  className="shrink-0 text-success"
                                />
                              ) : status === "in_progress" ? (
                                <PlayCircle
                                  size={17}
                                  className="shrink-0 text-forest-500"
                                />
                              ) : (
                                <Circle
                                  size={17}
                                  className="shrink-0 text-cream-400"
                                />
                              )}
                              <span className="flex-1 text-sm text-forest-950/80">
                                {lesson.title}
                              </span>
                              <span className="text-xs text-forest-950/40">
                                {lesson.durationMin}분
                              </span>
                            </>
                          );
                          return (
                            <li key={lesson.id}>
                              {enrolled ? (
                                <Link
                                  href={`/learn/${course.id}?lesson=${lesson.id}`}
                                  className="flex min-h-[48px] items-center gap-3 px-4 py-2.5 transition-colors hover:bg-cream-50"
                                >
                                  {inner}
                                </Link>
                              ) : (
                                <div className="flex min-h-[48px] items-center gap-3 px-4 py-2.5">
                                  {inner}
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 수강 후기 */}
          <section className="card p-6">
            <h2 className="mb-4 text-lg font-bold text-forest-950">
              수강 후기{" "}
              <span className="text-sm font-medium text-forest-950/45">
                {reviews.length}개
              </span>
            </h2>
            {reviews.length === 0 ? (
              <p className="text-sm text-forest-950/50">
                아직 후기가 없어요. 첫 후기의 주인공이 되어보세요.
              </p>
            ) : (
              <ul className="space-y-4">
                {reviews.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-xl border border-cream-200 p-4"
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-sm font-bold text-forest-950">
                        {r.author}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-forest-950/50">
                        <Star size={12} className="fill-gold-400 text-gold-400" />
                        {r.rating}.0 · {r.date}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-forest-950/70">
                      {r.content}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* 사이드 */}
        <aside className="space-y-5">
          {instructor && (
            <section className="card p-5">
              <h3 className="mb-3 text-sm font-bold text-forest-950">강사 소개</h3>
              <div className="flex items-center gap-3">
                <InstructorAvatar name={instructor.name} />
                <div>
                  <p className="font-display text-[22px] font-semibold text-forest-950">
                    {instructor.name}
                  </p>
                  <p className="text-xs text-forest-950/55">{instructor.title}</p>
                </div>
              </div>
              <p className="mt-3 text-[19px] leading-relaxed text-forest-950/65">
                {instructor.bio}
              </p>
            </section>
          )}

          <section className="card p-5">
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-forest-950">
              <ListChecks size={15} className="text-forest-600" />
              이런 분께 추천해요
            </h3>
            <ul className="space-y-2">
              {course.goals.map((g) => (
                <li key={g} className="flex gap-2 text-[19px] leading-relaxed text-forest-950/70">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-success" />
                  {g}
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-5">
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-forest-950">
              <BarChart3 size={15} className="text-forest-600" />
              준비사항
            </h3>
            <ul className="space-y-2">
              {course.requirements.map((r) => (
                <li key={r} className="flex gap-2 text-[19px] leading-relaxed text-forest-950/70">
                  <Circle size={7} className="mt-1.5 shrink-0 fill-forest-300 text-forest-300" />
                  {r}
                </li>
              ))}
            </ul>
          </section>
        </aside>
        </div>
        {/* 고정 CTA에 가려지지 않도록 여백 확보 */}
        <div className="h-24 lg:hidden" />
      </div>

      {/* 모바일 하단 고정 CTA — animate-fade-up의 transform 밖에 두어야 뷰포트 기준으로 고정된다 */}
      <div
        className="fixed inset-x-0 z-50 border-t border-cream-200 bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgba(19,31,25,0.08)] backdrop-blur lg:hidden"
        style={{ bottom: "calc(64px + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="min-w-0 flex-1">
            {enrolled ? (
              <>
                <p className="text-xs text-forest-950/50">내 진도율</p>
                <div className="mt-1 flex items-center gap-2">
                  <ProgressBar value={pct} height="h-1.5" animate={false} />
                  <span className="shrink-0 text-xs font-bold text-forest-700">
                    {pct}%
                  </span>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-forest-950/50">수강료</p>
                <p className="font-display text-lg font-semibold text-forest-950">
                  {formatPrice(course.price)}
                </p>
              </>
            )}
          </div>
          <button
            onClick={handleEnroll}
            disabled={enrolling}
            className="btn-press inline-flex min-h-[52px] shrink-0 items-center gap-2 rounded-full bg-forest-900 px-6 text-sm font-bold text-cream-50 transition-colors hover:bg-forest-800 disabled:opacity-70"
          >
            <PlayCircle size={18} />
            {enrolling
              ? "등록 중..."
              : enrolled
                ? pct > 0
                  ? "이어보기"
                  : "학습 시작"
                : "수강 시작하기"}
          </button>
        </div>
      </div>
    </>
  );
}
