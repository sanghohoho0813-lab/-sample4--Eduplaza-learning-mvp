"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { notFound, useParams, useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import {
  Award,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Gauge,
  Heart,
  ListChecks,
  NotebookPen,
  PlayCircle,
  Star,
  Users,
} from "lucide-react";
import {
  ASSIGNMENTS,
  COURSES,
  LEVEL_LABEL,
  QUIZZES,
  courseLessons,
  courseReviews,
  formatMinutes,
  formatPrice,
  getCategory,
  getCourse,
  getInstructor,
} from "@/lib/data";
import { getOutcome } from "@/lib/outcomes";
import { DEFAULT_DAILY_MIN, nextStepCourse, studyEstimate } from "@/lib/coach";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { CourseThumbnail, InstructorAvatar } from "@/components/Thumbnail";
import { ProgressBar } from "@/components/ProgressBar";
import type { Course, CourseLevel } from "@/lib/types";

const LEVEL_HINT: Record<CourseLevel, string> = {
  beginner: "사전 지식 없어도 돼요",
  intermediate: "기초 개념이 필요해요",
  advanced: "실무 경험을 권해요",
};

/** 1,2개 섹션은 바로 보이고 나머지는 접혀 있다 — 긴 커리큘럼이 아래 정보를 밀어내지 않게 */
const OPEN_BY_DEFAULT = 2;
const REVIEWS_PREVIEW = 3;

const SECTION_NAV = [
  { id: "intro", label: "소개" },
  { id: "curriculum", label: "커리큘럼" },
  { id: "instructor", label: "강사" },
  { id: "reviews", label: "후기" },
] as const;
type SectionId = (typeof SECTION_NAV)[number]["id"];

const daysLabel = (days: number) => (days >= 14 ? `약 ${Math.round(days / 7)}주` : `약 ${days}일`);

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const course = getCourse(params.id);
  const store = useStore();
  const { toast } = useToast();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [allReviews, setAllReviews] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  const reviews = useMemo(
    () => (course ? [...courseReviews(course.id)].sort((a, b) => b.date.localeCompare(a.date)) : []),
    [course]
  );
  const estimate = useMemo(
    () => (course ? studyEstimate(store.state, course) : null),
    [course, store.state]
  );

  // 목차 탭 — 스크롤하는 동안 지금 읽는 섹션을 표시한다
  const [activeSection, setActiveSection] = useState<SectionId>("intro");
  useEffect(() => {
    const els = SECTION_NAV.map((x) => document.getElementById(x.id)).filter((el): el is HTMLElement => Boolean(el));
    if (els.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveSection(visible[0].target.id as SectionId);
      },
      // 화면 위쪽 1/3 안에 들어온 섹션을 '읽는 중'으로 본다
      { rootMargin: "-80px 0px -60% 0px" }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [course?.id]);

  if (!course || !estimate) return notFound();

  const instructor = getInstructor(course.instructorId);
  const outcome = getOutcome(course.id);
  const nextStep = nextStepCourse(course);
  const quizzes = QUIZZES.filter((q) => q.courseId === course.id);
  const assignments = ASSIGNMENTS.filter((a) => a.courseId === course.id);
  const lessons = courseLessons(course);
  const enrolled = store.isEnrolled(course.id);
  const pct = store.courseProgress(course.id);
  const next = store.nextLesson(course.id);
  const fav = store.isFavorite(course.id);
  const doneCount = lessons.filter((l) => store.lessonStatus(l.id) === "completed").length;
  const finished = enrolled && pct >= 100;
  const otherCourses = COURSES.filter(
    (c) => c.instructorId === course.instructorId && c.id !== course.id
  );

  const ctaLabel = enrolling
    ? "수강 등록 중..."
    : enrolled
      ? finished
        ? "처음부터 다시 보기"
        : pct > 0
          ? "이어서 학습하기"
          : "학습 시작하기"
      : "수강 시작하기";

  const handleEnroll = () => {
    if (enrolled) {
      // 다 들은 강의는 처음 레슨부터 다시
      router.push(`/learn/${course.id}?lesson=${(next ?? lessons[0]).id}`);
      return;
    }
    // 기다리게 하지 않고 바로 첫 레슨으로 — 신청 완료는 토스트로 알린다
    setEnrolling(true);
    store.enroll(course.id);
    toast("수강 신청 완료! 첫 레슨부터 시작해요", "celebrate");
    router.push(`/learn/${course.id}?lesson=${lessons[0].id}`);
  };

  const toggleFav = () => {
    store.toggleFavorite(course.id);
    toast(fav ? "찜 목록에서 뺐어요" : "찜 목록에 담았어요", fav ? "info" : "success");
  };

  // 링크로 바로 들어온 경우(이전 화면 없음)에는 강의 목록으로 보낸다
  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.push("/courses");
  };

  const isOpen = (id: string, index: number) => openSections[id] ?? index < OPEN_BY_DEFAULT;
  const allOpen = course.sections.every((s, i) => isOpen(s.id, i));
  const toggleSection = (id: string, index: number) =>
    setOpenSections((s) => ({ ...s, [id]: !isOpen(id, index) }));
  const toggleAll = () =>
    setOpenSections(Object.fromEntries(course.sections.map((s) => [s.id, !allOpen])));

  const shownReviews = allReviews ? reviews : reviews.slice(0, REVIEWS_PREVIEW);

  return (
    <>
      <div className="animate-fade-up">
        <button
          onClick={goBack}
          className="btn-press mb-3 inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-forest-950/68 hover:text-forest-950"
        >
          <ChevronLeft size={16} />
          돌아가기
        </button>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr),340px] xl:grid-cols-[minmax(0,1fr),360px]">
          <div className="min-w-0 space-y-6">
            {/* 1. 무엇을 · 얼마나 · 어떤 난이도로 — 결정을 위한 핵심 사실 */}
            <section className="relative overflow-hidden rounded-2xl bg-forest-950 text-cream-50 shadow-card md:flex md:flex-row-reverse md:items-start lg:block">
              <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-forest-600/25 blur-3xl" />
              {/* 썸네일 — PC는 오른쪽 수강 카드에 있다 */}
              <div className="relative md:w-[280px] md:shrink-0 md:py-8 md:pr-8 lg:hidden">
                <CourseThumbnail
                  tone={course.thumbnailTone}
                  title={course.title}
                  courseId={course.id}
                  priority
                  sizes="(min-width: 768px) 280px, 100vw"
                  rounded="rounded-none md:rounded-xl"
                />
              </div>
              <div className="relative min-w-0 p-5 md:flex-1 md:p-8">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="chip bg-forest-800 text-cream-100">
                    {getCategory(course.categoryId)?.name}
                  </span>
                  {enrolled && (
                    <span className="chip bg-gold-300 text-forest-950">
                      {finished ? "완주한 강의" : "수강 중"}
                    </span>
                  )}
                </div>
                <h1 className="mt-3 font-display text-2xl font-semibold leading-snug md:text-[2rem]">
                  {course.title}
                </h1>
                <p className="mt-2 text-base text-cream-200/80">{course.subtitle}</p>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-cream-200/80">
                  <a href="#reviews" className="inline-flex items-center gap-1.5 hover:text-cream-50">
                    <Star size={15} className="fill-gold-300 text-gold-300" />
                    <b className="text-cream-50">{course.rating.toFixed(1)}</b>
                    <span className="text-cream-200/70 underline-offset-2 hover:underline">
                      수강평 {course.reviewCount}개
                    </span>
                  </a>
                  <span className="inline-flex items-center gap-1.5">
                    <Users size={15} />
                    {course.studentCount.toLocaleString()}명 수강
                  </span>
                  {instructor && (
                    <a href="#instructor" className="hover:text-cream-50">
                      강사 {instructor.name}
                    </a>
                  )}
                </div>

                <dl className="mt-5 grid grid-cols-1 gap-px overflow-hidden rounded-xl bg-cream-50/10 sm:mt-6 sm:grid-cols-3">
                  <HeroFact icon={Gauge} label="난이도" value={LEVEL_LABEL[course.level]} hint={LEVEL_HINT[course.level]} />
                  <HeroFact
                    icon={Clock}
                    label="총 학습시간"
                    value={formatMinutes(course.totalMinutes)}
                    hint={`레슨 ${lessons.length}개`}
                  />
                  <HeroFact
                    icon={CalendarDays}
                    label={enrolled && !finished ? "완주까지" : "예상 기간"}
                    value={finished ? "완주" : daysLabel(estimate.days)}
                    hint={finished ? "모든 레슨 완료" : `하루 ${DEFAULT_DAILY_MIN}분 기준`}
                  />
                </dl>

                {enrolled && (
                  <div className="mt-5 lg:hidden">
                    <div className="mb-1.5 flex justify-between text-xs text-cream-200/75">
                      <span>
                        레슨 {doneCount}/{lessons.length}
                      </span>
                      <span className="font-bold text-cream-50">{pct}%</span>
                    </div>
                    <ProgressBar
                      label="내 진도율"
                      value={pct}
                      trackClass="bg-forest-800"
                      fillClass="bg-gradient-to-r from-cream-300 to-gold-300"
                    />
                  </div>
                )}
              </div>
            </section>

            {/* 목차 — 긴 상세에서 원하는 정보로 바로, 지금 위치도 함께 */}
            <nav
              aria-label="강의 정보 목차"
              className="sticky top-0 z-30 -mx-4 bg-cream-100/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 lg:py-3"
            >
              <ul className="flex gap-1 rounded-full bg-white p-1 shadow-card">
                {SECTION_NAV.filter((x) => x.id !== "instructor" || instructor).map((x) => (
                  <li key={x.id} className="flex-1">
                    <a
                      href={`#${x.id}`}
                      aria-current={activeSection === x.id ? "location" : undefined}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveSection(x.id);
                        document.getElementById(x.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className={clsx(
                        "flex min-h-[40px] items-center justify-center whitespace-nowrap rounded-full px-2 text-xs font-semibold transition-colors sm:px-3 sm:text-sm",
                        activeSection === x.id
                          ? "bg-forest-950 text-cream-50"
                          : "text-forest-950/68 hover:bg-cream-100 hover:text-forest-950"
                      )}
                    >
                      {x.label}
                      {x.id === "reviews" && (
                        <span
                          className={clsx(
                            "ml-1 hidden text-xs font-medium sm:inline",
                            activeSection === x.id ? "text-cream-200/80" : "text-forest-950/68"
                          )}
                        >
                          {course.reviewCount}
                        </span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* 2. 무엇을 배우나요 */}
            <section id="intro" aria-labelledby="learn-heading" className="card scroll-mt-20 p-5 md:p-6">
              <h2 id="learn-heading" className="text-lg font-bold text-forest-950">
                이 강의에서 배우는 것
              </h2>
              <p className="mt-2 text-base leading-relaxed text-forest-950/75">{course.description}</p>
              {outcome && (
                <ul className="mt-4 space-y-2.5">
                  {outcome.skills.map((s) => (
                    <li key={s} className="flex gap-2.5 text-base leading-relaxed text-forest-950/85">
                      <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success" />
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* 3. 누구에게 필요한가 + 시작 전 준비 */}
            <section aria-labelledby="for-heading" className="card p-5 md:p-6">
              <h2 id="for-heading" className="text-lg font-bold text-forest-950">
                이런 분께 필요해요
              </h2>
              <ul className="mt-3 space-y-2">
                {course.goals.map((g) => (
                  <li key={g} className="flex gap-2.5 text-base leading-relaxed text-forest-950/80">
                    <ListChecks size={17} className="mt-1 shrink-0 text-forest-600" />
                    {g}
                  </li>
                ))}
              </ul>
              <div className="mt-5 rounded-xl bg-cream-50 px-4 py-3.5">
                <p className="text-sm font-bold text-forest-950">
                  시작 전에 · <span className="font-semibold text-forest-700">{LEVEL_LABEL[course.level]}</span>
                </p>
                <ul className="mt-1.5 space-y-1">
                  {course.requirements.map((r) => (
                    <li key={r} className="flex gap-2 text-sm leading-relaxed text-forest-950/72">
                      <Circle size={6} className="mt-2 shrink-0 fill-forest-400 text-forest-400" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* 4. 커리큘럼 */}
            <section id="curriculum" aria-labelledby="curriculum-heading" className="card scroll-mt-20 p-5 md:p-6">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 id="curriculum-heading" className="text-lg font-bold text-forest-950">
                    커리큘럼
                  </h2>
                  <p className="mt-0.5 text-sm text-forest-950/68">
                    {course.sections.length}개 섹션 · 레슨 {lessons.length}개 · 총{" "}
                    {formatMinutes(course.totalMinutes)}
                    {enrolled && ` · ${doneCount}개 완료`}
                  </p>
                </div>
                <button
                  onClick={toggleAll}
                  className="btn-press min-h-[40px] rounded-full px-3 text-sm font-semibold text-forest-700 hover:bg-cream-100"
                >
                  {allOpen ? "모두 접기" : "모두 펼치기"}
                </button>
              </div>
              <div className="space-y-2.5">
                {course.sections.map((section, index) => {
                  const open = isOpen(section.id, index);
                  const minutes = section.lessons.reduce((s, l) => s + l.durationMin, 0);
                  const sectionDone = section.lessons.filter(
                    (l) => store.lessonStatus(l.id) === "completed"
                  ).length;
                  return (
                    <div key={section.id} className="overflow-hidden rounded-xl border border-cream-200">
                      <button
                        onClick={() => toggleSection(section.id, index)}
                        aria-expanded={open}
                        className="flex min-h-[52px] w-full items-center justify-between gap-3 bg-cream-50 px-4 py-3 text-left"
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-bold text-forest-950">
                            {section.order}. {section.title}
                          </span>
                          <span className="mt-0.5 block text-xs text-forest-950/68">
                            레슨 {section.lessons.length}개 · {minutes}분
                            {enrolled && sectionDone > 0 && ` · ${sectionDone}개 완료`}
                          </span>
                        </span>
                        <ChevronDown
                          size={17}
                          className={clsx(
                            "shrink-0 text-forest-950/68 transition-transform duration-200",
                            open && "rotate-180"
                          )}
                        />
                      </button>
                      {open && (
                        <ul className="divide-y divide-cream-100">
                          {section.lessons.map((lesson) => {
                            const status = store.lessonStatus(lesson.id);
                            const isNext = enrolled && next?.id === lesson.id;
                            const inner = (
                              <>
                                {status === "completed" ? (
                                  <CheckCircle2 size={17} className="shrink-0 text-success" />
                                ) : status === "in_progress" || isNext ? (
                                  <PlayCircle size={17} className="shrink-0 text-forest-500" />
                                ) : enrolled ? (
                                  <Circle size={17} className="shrink-0 text-cream-400" />
                                ) : (
                                  <span className="flex h-[17px] w-[17px] shrink-0 items-center justify-center text-xs font-semibold text-forest-950/68">
                                    {lesson.order}
                                  </span>
                                )}
                                <span
                                  className={clsx(
                                    "flex-1 text-sm",
                                    isNext ? "font-semibold text-forest-950" : "text-forest-950/80"
                                  )}
                                >
                                  {lesson.title}
                                  {isNext && (
                                    <span className="ml-2 text-xs font-bold text-forest-600">다음 레슨</span>
                                  )}
                                </span>
                                <span className="text-xs text-forest-950/68">{lesson.durationMin}분</span>
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
                                  <div className="flex min-h-[48px] items-center gap-3 px-4 py-2.5">{inner}</div>
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
              {(quizzes.length > 0 || assignments.length > 0) && (
                <ul className="mt-4 space-y-2 border-t border-cream-200 pt-4">
                  {quizzes.map((q) => (
                    <li key={q.id} className="flex items-center gap-2.5 text-sm text-forest-950/80">
                      <ListChecks size={16} className="shrink-0 text-teal-600" />
                      <span className="flex-1">
                        <span className="font-semibold">퀴즈</span> · {q.title}
                      </span>
                      <span className="text-xs text-forest-950/68">{q.questions.length}문항</span>
                    </li>
                  ))}
                  {assignments.map((a) => (
                    <li key={a.id} className="flex items-center gap-2.5 text-sm text-forest-950/80">
                      <NotebookPen size={16} className="shrink-0 text-amber-600" />
                      <span className="flex-1">
                        <span className="font-semibold">과제</span> · {a.title}
                      </span>
                      {enrolled && store.assignmentStatus(a.id) !== "pending" && (
                        <span className="text-xs font-semibold text-success">제출 완료</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* 5. 강사 */}
            {instructor && (
              <section id="instructor" aria-labelledby="instructor-heading" className="card scroll-mt-20 p-5 md:p-6">
                <h2 id="instructor-heading" className="text-lg font-bold text-forest-950">
                  강사
                </h2>
                <div className="mt-3 flex items-center gap-3.5">
                  <InstructorAvatar name={instructor.name} size="h-14 w-14" className="text-lg" />
                  <div>
                    <p className="font-display text-lg font-semibold text-forest-950">{instructor.name}</p>
                    <p className="text-sm text-forest-950/68">{instructor.title}</p>
                  </div>
                </div>
                <p className="mt-3 text-base leading-relaxed text-forest-950/75">{instructor.bio}</p>
                {otherCourses.length > 0 && (
                  <p className="mt-3 text-sm text-forest-950/68">
                    다른 강의 ·{" "}
                    {otherCourses.map((c, i) => (
                      <span key={c.id}>
                        {i > 0 && ", "}
                        <Link href={`/courses/${c.id}`} className="font-semibold text-forest-700 hover:underline">
                          {c.title}
                        </Link>
                      </span>
                    ))}
                  </p>
                )}
              </section>
            )}

            {/* 6. 수강생 반응 */}
            <section id="reviews" aria-labelledby="reviews-heading" className="card scroll-mt-20 p-5 md:p-6">
              <h2 id="reviews-heading" className="text-lg font-bold text-forest-950">
                수강생 반응
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl bg-cream-50 px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <span className="font-display text-3xl font-semibold text-forest-950">
                    {course.rating.toFixed(1)}
                  </span>
                  <span className="flex" role="img" aria-label={`5점 만점에 ${course.rating.toFixed(1)}점`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={16}
                        className={clsx(
                          n <= Math.round(course.rating) ? "fill-gold-400 text-gold-400" : "text-cream-300"
                        )}
                      />
                    ))}
                  </span>
                </div>
                <p className="text-sm text-forest-950/72">
                  수강평 <b className="text-forest-950">{course.reviewCount}</b>개 · 수강생{" "}
                  <b className="text-forest-950">{course.studentCount.toLocaleString()}</b>명
                </p>
              </div>
              {reviews.length === 0 ? (
                <p className="mt-4 text-sm text-forest-950/68">
                  아직 이곳에 소개된 후기가 없어요. 완주하고 첫 후기를 남겨 주세요.
                </p>
              ) : (
                <>
                  <ul className="mt-4 divide-y divide-cream-200">
                    {shownReviews.map((r) => (
                      <li key={r.id} className="py-3.5 first:pt-0 last:pb-0">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-forest-950">{r.author}</span>
                          <span className="inline-flex items-center gap-1 text-xs text-forest-950/68">
                            <Star size={12} className="fill-gold-400 text-gold-400" />
                            {r.rating}.0 · {r.date.replace(/-/g, ".")}
                          </span>
                        </div>
                        <p className="text-base leading-relaxed text-forest-950/75">{r.content}</p>
                      </li>
                    ))}
                  </ul>
                  {reviews.length > REVIEWS_PREVIEW && (
                    <button
                      onClick={() => setAllReviews((v) => !v)}
                      className="btn-press mt-3 min-h-[44px] rounded-full px-3 text-sm font-semibold text-forest-700 hover:bg-cream-100"
                    >
                      {allReviews ? "접기" : `후기 ${reviews.length - REVIEWS_PREVIEW}개 더 보기`}
                    </button>
                  )}
                </>
              )}
            </section>

            {/* 7. 완주하면 */}
            <section aria-labelledby="after-heading" className="card overflow-hidden">
              <div className="p-5 md:p-6">
                <h2 id="after-heading" className="text-lg font-bold text-forest-950">
                  완주하면
                </h2>
                <ul className="mt-3 space-y-3">
                  {outcome && (
                    <AfterItem
                      icon={Award}
                      title={`직접 만든 결과물 · ${outcome.project}`}
                      detail="마지막 실습에서 완성해 포트폴리오나 업무에 바로 쓸 수 있어요"
                    />
                  )}
                  <AfterItem
                    icon={CheckCircle2}
                    title="학습 리포트에 ‘강의 완주’ 기록"
                    detail="레슨·퀴즈·과제 기록이 그대로 남아 언제든 다시 돌아볼 수 있어요"
                  />
                  {quizzes.length > 0 && (
                    <AfterItem
                      icon={ListChecks}
                      title="퀴즈로 확인한 이해도"
                      detail="틀린 문제는 복습 목록에 모여 맞힐 때까지 다시 풀 수 있어요"
                    />
                  )}
                </ul>
              </div>
              {nextStep && <NextStep step={nextStep.course} reason={nextStep.reason} />}
            </section>
          </div>

          {/* PC: 결정과 행동을 위한 카드 — 스크롤해도 따라온다 */}
          <aside className="hidden lg:block">
            <div className="card sticky top-6 overflow-hidden">
              <CourseThumbnail
                tone={course.thumbnailTone}
                title={course.title}
                courseId={course.id}
                priority
                sizes="360px"
                rounded="rounded-none"
              />
              <div className="p-5">
                {enrolled ? (
                  <>
                    <div className="mb-1.5 flex items-baseline justify-between">
                      <span className="text-sm font-semibold text-forest-950/72">
                        레슨 {doneCount}/{lessons.length}
                      </span>
                      <span className="font-display text-xl font-semibold text-forest-950">{pct}%</span>
                    </div>
                    <ProgressBar label="내 진도율" value={pct} />
                    {next && !finished && (
                      <p className="mt-3 text-sm text-forest-950/72">
                        다음 · <span className="font-semibold text-forest-950">{next.title}</span>{" "}
                        <span className="whitespace-nowrap">{next.durationMin}분</span>
                      </p>
                    )}
                  </>
                ) : (
                  <p className="font-display text-2xl font-semibold text-forest-950">
                    {formatPrice(course.price)}
                  </p>
                )}

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="btn-press inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-full bg-forest-900 px-5 text-base font-bold text-cream-50 transition-colors hover:bg-forest-800 disabled:opacity-70"
                  >
                    <PlayCircle size={19} />
                    {ctaLabel}
                  </button>
                  <button
                    onClick={toggleFav}
                    aria-label={fav ? "찜 해제" : "찜하기"}
                    aria-pressed={fav}
                    className="btn-press flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border border-cream-300 bg-white text-forest-800 hover:bg-cream-50"
                  >
                    <Heart size={20} className={clsx(fav && "fill-gold-400 text-gold-400")} />
                  </button>
                </div>

                <StudyPlanNote estimate={estimate} enrolled={enrolled} finished={finished} ready={store.ready} />

                <ul className="mt-4 space-y-2 border-t border-cream-200 pt-4 text-sm text-forest-950/75">
                  <Include icon={PlayCircle}>
                    레슨 {lessons.length}개 · {formatMinutes(course.totalMinutes)}
                  </Include>
                  {quizzes.length > 0 && (
                    <Include icon={ListChecks}>
                      퀴즈 {quizzes.length}개 · 오답은 복습 목록으로
                    </Include>
                  )}
                  {assignments.length > 0 && (
                    <Include icon={NotebookPen}>과제 {assignments.length}개 · 제출 기록 보관</Include>
                  )}
                  <Include icon={Clock}>재생 위치를 남기는 레슨 메모</Include>
                  <Include icon={CalendarDays}>기간 제한 없이 수강</Include>
                </ul>
              </div>
            </div>
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
          <button
            onClick={toggleFav}
            aria-label={fav ? "찜 해제" : "찜하기"}
            aria-pressed={fav}
            className="btn-press flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border border-cream-300 bg-white text-forest-800"
          >
            <Heart size={21} className={clsx(fav && "fill-gold-400 text-gold-400 animate-check-pop")} />
          </button>
          <div className="min-w-0 flex-1">
            {enrolled ? (
              <>
                <p className="text-xs text-forest-950/68">내 진도율</p>
                <div className="mt-1 flex items-center gap-2">
                  <ProgressBar label="내 진도율" value={pct} height="h-1.5" animate={false} />
                  <span className="shrink-0 text-xs font-bold text-forest-700">{pct}%</span>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-forest-950/68">수강료</p>
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
                ? finished
                  ? "다시 보기"
                  : pct > 0
                    ? "이어보기"
                    : "학습 시작"
                : "수강 시작하기"}
          </button>
        </div>
      </div>
    </>
  );
}

function HeroFact({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    // 모바일은 한 줄씩(라벨 ↔ 값), sm 이상은 3칸
    <div className="flex items-center justify-between gap-3 bg-forest-900/80 px-4 py-2.5 sm:block sm:px-4 sm:py-3">
      <dt className="flex shrink-0 items-center gap-1.5 text-xs text-cream-200/70">
        <Icon size={13} aria-hidden />
        {label}
      </dt>
      <dd className="min-w-0 text-right sm:mt-1 sm:text-left">
        <span className="block whitespace-nowrap font-display text-base font-semibold leading-tight text-cream-50 sm:text-lg">
          {value}
        </span>
        <span className="mt-0.5 block text-xs leading-snug text-cream-200/70">{hint}</span>
      </dd>
    </div>
  );
}

/** 학습 기간 예상 — 내 최근 7일 페이스가 있으면 그 기준을 함께 보여준다(없으면 지어내지 않는다) */
function StudyPlanNote({
  estimate,
  enrolled,
  finished,
  ready,
}: {
  estimate: ReturnType<typeof studyEstimate>;
  enrolled: boolean;
  finished: boolean;
  ready: boolean;
}) {
  if (finished) {
    return (
      <p className="mt-3 rounded-xl bg-success/10 px-3.5 py-2.5 text-sm font-semibold text-success">
        모든 레슨을 완주했어요
      </p>
    );
  }
  const what = enrolled ? `남은 ${formatMinutes(estimate.minutes)}` : `총 ${formatMinutes(estimate.minutes)}`;
  return (
    <div className="mt-3 rounded-xl bg-cream-50 px-3.5 py-2.5 text-sm leading-relaxed text-forest-950/75">
      <p>
        {what} · 하루 {DEFAULT_DAILY_MIN}분이면{" "}
        <b className="text-forest-950">{daysLabel(estimate.days)}</b>
      </p>
      {ready && estimate.myDailyMin !== null && estimate.myDays !== null && (
        <p className="mt-0.5 text-forest-950/68">
          최근 내 페이스(하루 평균 {estimate.myDailyMin}분)로는 {daysLabel(estimate.myDays)}
        </p>
      )}
    </div>
  );
}

function Include({ icon: Icon, children }: { icon: typeof Clock; children: ReactNode }) {
  return (
    <li className="flex items-center gap-2.5">
      <Icon size={16} className="shrink-0 text-forest-600" aria-hidden />
      <span>{children}</span>
    </li>
  );
}

function AfterItem({ icon: Icon, title, detail }: { icon: typeof Clock; title: string; detail: string }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-50 text-forest-700">
        <Icon size={18} aria-hidden />
      </span>
      <span>
        <span className="block text-base font-semibold text-forest-950">{title}</span>
        <span className="mt-0.5 block text-sm leading-relaxed text-forest-950/68">{detail}</span>
      </span>
    </li>
  );
}

function NextStep({ step, reason }: { step: Course; reason: string }) {
  return (
    <Link
      href={`/courses/${step.id}`}
      className="group flex items-center gap-4 border-t border-cream-200 bg-cream-50 px-5 py-4 transition-colors hover:bg-cream-100 md:px-6"
    >
      <div className="w-24 shrink-0 overflow-hidden rounded-lg sm:w-28">
        <CourseThumbnail tone={step.thumbnailTone} title={step.title} courseId={step.id} sizes="112px" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-forest-700">{reason}</p>
        <p className="mt-0.5 line-clamp-2 text-base font-bold text-forest-950">{step.title}</p>
        <p className="mt-0.5 text-xs text-forest-950/68">
          {LEVEL_LABEL[step.level]} · {formatMinutes(step.totalMinutes)}
        </p>
      </div>
      <ChevronRight size={18} className="shrink-0 text-forest-950/50 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
