"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  Bell,
  BookOpen,
  ChevronRight,
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
import { useToast } from "@/components/Toast";
import { Header } from "@/components/Header";
import { ListSkeleton } from "@/components/Skeletons";

export default function MyPage() {
  const store = useStore();
  const { toast } = useToast();
  const [notif, setNotif] = useState({
    daily: true,
    assignment: true,
    marketing: false,
  });

  if (!store.ready) {
    return (
      <div>
        <Header title="마이페이지" />
        <ListSkeleton rows={5} />
      </div>
    );
  }

  const { state } = store;
  const weeklyTotal = state.weeklyMinutes.reduce((a, b) => a + b, 0);

  // 결제내역 데모: 수강 중 유료 강의 기준
  const payments = state.enrollments
    .map((e) => {
      const course = COURSES.find((c) => c.id === e.courseId);
      return course ? { course, date: e.enrolledAt } : null;
    })
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const resetDemo = () => {
    try {
      localStorage.removeItem("eduplaza-state-v1");
    } catch {
      // ignore
    }
    location.reload();
  };

  const quickLinks = [
    { href: "/my-learning", label: "내 강의", icon: BookOpen },
    { href: "/my-learning", label: "찜한 강의", icon: Heart },
    { href: "/notes", label: "학습노트", icon: NotebookPen },
    { href: "/report", label: "학습 기록", icon: GraduationCap },
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
              {state.name}님
            </h2>
            <p className="mt-1 text-sm text-cream-200/70">
              {state.streakDays}일 연속 학습 중이에요 🔥 오늘도 한 걸음
              성장해볼까요?
            </p>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="flex items-center justify-center gap-1 text-xs text-cream-200/60">
                <Timer size={12} /> 이번 주
              </p>
              <p className="mt-1 font-display text-lg font-semibold">
                {formatMinutes(weeklyTotal)}
              </p>
            </div>
            <div>
              <p className="flex items-center justify-center gap-1 text-xs text-cream-200/60">
                <Flame size={12} /> 연속
              </p>
              <p className="mt-1 font-display text-lg font-semibold">
                {state.streakDays}일
              </p>
            </div>
            <div>
              <p className="flex items-center justify-center gap-1 text-xs text-cream-200/60">
                <GraduationCap size={12} /> 완료
              </p>
              <p className="mt-1 font-display text-lg font-semibold">
                {store.completedCourseCount()}개
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* 바로가기 */}
        <section className="card p-5">
          <h3 className="mb-3 text-sm font-bold text-forest-950">바로가기</h3>
          <ul className="grid grid-cols-2 gap-2.5">
            {quickLinks.map(({ href, label, icon: Icon }) => (
              <li key={label}>
                <Link
                  href={href}
                  className="btn-press flex min-h-[56px] items-center gap-3 rounded-xl border border-cream-200 px-4 transition-colors hover:border-forest-300 hover:bg-cream-50"
                >
                  <Icon size={18} className="text-forest-600" />
                  <span className="flex-1 text-sm font-semibold text-forest-950">
                    {label}
                  </span>
                  <ChevronRight size={15} className="text-forest-950/30" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* 관심분야 */}
        <section className="card p-5">
          <h3 className="mb-1 text-sm font-bold text-forest-950">관심분야</h3>
          <p className="mb-3 text-xs text-forest-950/50">
            관심분야를 기반으로 홈에서 강의를 추천해드려요.
          </p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const active = state.interests.includes(c.id);
              return (
                <span
                  key={c.id}
                  className={clsx(
                    "chip min-h-[36px] px-3.5",
                    active
                      ? "bg-forest-900 text-cream-50"
                      : "bg-cream-100 text-forest-950/45"
                  )}
                >
                  {c.name}
                </span>
              );
            })}
          </div>
        </section>

        {/* 결제내역 데모 */}
        <section className="card p-5">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-forest-950">
            <CreditCard size={15} className="text-forest-600" />
            결제내역
            <span className="chip bg-cream-100 text-forest-950/45">Demo</span>
          </h3>
          <ul className="divide-y divide-cream-100">
            {payments.slice(0, 5).map(({ course, date }) => (
              <li
                key={course.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-forest-950/85">
                    {course.title}
                  </p>
                  <p className="text-xs text-forest-950/45">
                    {new Date(date).toLocaleDateString("ko-KR")} · 카드 결제
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold text-forest-950">
                  {formatPrice(course.price)}
                </span>
              </li>
            ))}
          </ul>
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
                  <p className="text-xs text-forest-950/45">{desc}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={notif[key]}
                  aria-label={label}
                  onClick={() => {
                    setNotif((n) => ({ ...n, [key]: !n[key] }));
                    toast(
                      notif[key] ? "알림을 껐어요" : "알림을 켰어요",
                      "info"
                    );
                  }}
                  className={clsx(
                    "btn-press relative h-7 w-12 shrink-0 rounded-full transition-colors",
                    notif[key] ? "bg-forest-700" : "bg-cream-300"
                  )}
                >
                  <span
                    className={clsx(
                      "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all",
                      notif[key] ? "left-6" : "left-1"
                    )}
                  />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={resetDemo}
          className="btn-press inline-flex items-center gap-1.5 rounded-full border border-cream-300 px-5 py-2.5 text-xs font-semibold text-forest-950/45 transition-colors hover:text-forest-950/70"
        >
          <RotateCcw size={13} />
          데모 데이터 초기화
        </button>
      </div>
    </div>
  );
}
