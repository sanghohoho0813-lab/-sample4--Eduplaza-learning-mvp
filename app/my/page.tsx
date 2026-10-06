"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  CreditCard,
  Flame,
  GraduationCap,
  Heart,
  NotebookPen,
  RotateCcw,
  Timer,
} from "lucide-react";
import { CATEGORIES, COURSES, formatMinutes, formatPrice } from "@/lib/data";
import { useStore } from "@/lib/store";
import { BRAND } from "@/lib/brand";
import { useToast } from "@/components/Toast";
import { Header } from "@/components/Header";
import { ListSkeleton } from "@/components/Skeletons";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function MyPage() {
  const store = useStore();
  const { toast } = useToast();
  const [resetOpen, setResetOpen] = useState(false);
  const [showAllPay, setShowAllPay] = useState(false);

  if (!store.ready) {
    return (
      <div>
        <Header title="마이페이지" />
        <ListSkeleton rows={5} />
      </div>
    );
  }

  const { state, weeklyTotal, streak, notifications } = store;

  // 결제내역 데모: 수강 중 유료 강의 기준
  const payments = state.enrollments
    .map((e) => {
      const course = COURSES.find((c) => c.id === e.courseId);
      return course ? { course, date: e.enrolledAt } : null;
    })
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .sort((a, b) => b.date.localeCompare(a.date));

  const toggleInterest = (id: (typeof CATEGORIES)[number]["id"], name: string) => {
    const on = state.interests.includes(id);
    if (!store.toggleInterest(id)) {
      toast("관심분야는 1개 이상 골라주세요", "info");
      return;
    }
    toast(on ? `관심분야에서 ${name} 제외 · 홈 추천에 반영했어요` : `관심분야에 ${name} 추가 · 홈 추천에 반영했어요`, "success");
  };

  const resetDemo = () => {
    store.resetDemo();
    setResetOpen(false);
    setShowAllPay(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast("데모 데이터를 처음 상태로 되돌렸어요", "info");
  };

  const quickLinks = [
    { href: "/my-learning", label: "내 강의", icon: BookOpen },
    { href: "/my-learning?tab=favorite", label: "찜한 강의", icon: Heart },
    { href: "/notes", label: "학습노트", icon: NotebookPen },
    { href: "/report", label: "학습 리포트", icon: GraduationCap },
  ];

  return (
    <div className="animate-fade-up">
      <Header title="마이페이지" />

      {/* 프로필 */}
      <section className="relative overflow-hidden rounded-2xl bg-forest-950 p-6 text-cream-50 shadow-card md:p-8">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-forest-600/25 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-5">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-forest-500 to-forest-700 font-display text-2xl font-semibold">
            {state.name.charAt(0)}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-semibold md:text-2xl">
              {BRAND.company} {state.name}님
            </h2>
            <p className="mt-1 text-sm text-cream-200/70">
              {streak > 0
                ? `${streak}일 연속 학습 중이에요. 오늘도 한 걸음 성장해볼까요?`
                : "오늘 학습하면 연속 기록이 시작돼요."}
            </p>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="flex items-center justify-center gap-1 text-xs text-cream-200/70">
                <Timer size={12} /> 최근 7일
              </p>
              <p className="mt-1 font-display text-lg font-semibold">
                {formatMinutes(weeklyTotal)}
              </p>
            </div>
            <div>
              <p className="flex items-center justify-center gap-1 text-xs text-cream-200/70">
                <Flame size={12} /> 연속
              </p>
              <p className="mt-1 font-display text-lg font-semibold">
                {streak}일
              </p>
            </div>
            <div>
              <p className="flex items-center justify-center gap-1 text-xs text-cream-200/70">
                <GraduationCap size={12} /> 완료
              </p>
              <p className="mt-1 font-display text-lg font-semibold">
                {store.completedCourseCount()}개
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* 바로가기 */}
        <section className="card p-5">
          <h3 className="mb-3 text-sm font-bold text-forest-950">바로가기</h3>
          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-2">
            {quickLinks.map(({ href, label, icon: Icon }) => (
              <li key={label}>
                <Link
                  href={href}
                  className="btn-press flex min-h-[96px] flex-col items-center justify-center gap-2 rounded-xl border border-cream-200 px-2 text-center transition-colors hover:border-forest-300 hover:bg-cream-50"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-50 text-forest-600">
                    <Icon size={19} />
                  </span>
                  <span className="text-sm font-semibold text-forest-950">{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* 관심분야 */}
        <section className="card p-5">
          <h3 className="mb-1 text-sm font-bold text-forest-950">관심분야</h3>
          <p className="mb-3 text-xs text-forest-950/68">
            고른 분야로 홈의 &lsquo;다음에 들어볼 강의&rsquo;를 추천해요.
          </p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const active = state.interests.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggleInterest(c.id, c.name)}
                  aria-pressed={active}
                  className={clsx(
                    "btn-press inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors",
                    active
                      ? "border-forest-900 bg-forest-900 text-cream-50"
                      : "border-cream-300 bg-white text-forest-950/72 hover:border-forest-300"
                  )}
                >
                  {active && <Check size={14} />}
                  {c.name}
                </button>
              );
            })}
          </div>
        </section>

        {/* 결제내역 데모 */}
        <section className="card p-5">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-forest-950">
            <CreditCard size={15} className="text-forest-600" />
            결제내역
            <span className="chip bg-cream-100 text-forest-950/68">Demo</span>
          </h3>
          <ul className="divide-y divide-cream-100">
            {(showAllPay ? payments : payments.slice(0, 3)).map(({ course, date }) => (
              <li
                key={course.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-forest-950/85">
                    {course.title}
                  </p>
                  <p className="text-xs text-forest-950/68">
                    {new Date(date).toLocaleDateString("ko-KR")} · 카드 결제
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold text-forest-950">
                  {formatPrice(course.price)}
                </span>
              </li>
            ))}
          </ul>
          {payments.length > 3 && (
            <button
              onClick={() => setShowAllPay((v) => !v)}
              aria-expanded={showAllPay}
              className="btn-press mt-1 inline-flex min-h-[44px] w-full items-center justify-center gap-1 rounded-xl text-sm font-semibold text-forest-600 hover:bg-cream-50"
            >
              {showAllPay ? "접기" : `${payments.length - 3}건 더 보기`}
              <ChevronDown size={16} className={clsx("transition-transform", showAllPay && "rotate-180")} />
            </button>
          )}
        </section>

        {/* 알림 설정 */}
        <section className="card p-5">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-forest-950">
            <Bell size={15} className="text-forest-600" />
            알림 설정
          </h3>
          <ul className="space-y-1">
            {(
              [
                ["daily", "매일 학습 리마인드", "매일 저녁 8시에 학습을 알려드려요"],
                ["assignment", "과제 마감 알림", "마감 하루 전에 알려드려요"],
                ["marketing", "신규 강의 소식", "관심분야 새 강의를 알려드려요"],
              ] as const
            ).map(([key, label, desc]) => (
              <li
                key={key}
                className="flex min-h-[56px] items-center justify-between gap-3 py-1.5"
              >
                <div>
                  <p className="text-sm font-semibold text-forest-950">{label}</p>
                  <p className="text-xs text-forest-950/68">{desc}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={notifications[key]}
                  aria-label={label}
                  onClick={() => {
                    const on = !notifications[key];
                    store.setNotification(key, on);
                    toast(on ? `${label} 켜짐` : `${label} 꺼짐`, "info");
                  }}
                  className="btn-press flex h-11 w-14 shrink-0 items-center justify-center"
                >
                  <span
                    className={clsx(
                      "relative h-7 w-12 rounded-full transition-colors",
                      notifications[key] ? "bg-forest-700" : "bg-cream-300"
                    )}
                  >
                    <span
                      className={clsx(
                        "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all",
                        notifications[key] ? "left-6" : "left-1"
                      )}
                    />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={() => setResetOpen(true)}
          className="btn-press inline-flex items-center gap-1.5 rounded-full border border-cream-300 px-5 py-2.5 text-xs font-semibold text-forest-950/68 transition-colors hover:text-forest-950/70"
        >
          <RotateCcw size={13} />
          데모 데이터 초기화
        </button>
      </div>

      <ConfirmDialog
        open={resetOpen}
        title="데모 데이터를 처음 상태로 되돌릴까요?"
        description="지금까지의 수강 진도, 퀴즈 결과, 노트, 과제 제출 기록이 처음 샘플 상태로 바뀌어요."
        confirmLabel="초기화"
        danger
        onConfirm={resetDemo}
        onCancel={() => setResetOpen(false)}
      />
    </div>
  );
}
