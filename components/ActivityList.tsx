import clsx from "clsx";
import {
  Award,
  BookOpenCheck,
  ClipboardCheck,
  NotebookPen,
  PenSquare,
  PlayCircle,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import type { Activity, ActivityType } from "@/lib/types";
import { dayKey } from "@/lib/store";

const META: Record<ActivityType, { icon: LucideIcon; verb: string }> = {
  lesson: { icon: BookOpenCheck, verb: "레슨 완료" },
  quiz: { icon: PenSquare, verb: "퀴즈" },
  review: { icon: RotateCcw, verb: "오답 복습" },
  assignment: { icon: ClipboardCheck, verb: "과제 제출" },
  note: { icon: NotebookPen, verb: "노트 작성" },
  enroll: { icon: PlayCircle, verb: "수강 시작" },
  achievement: { icon: Award, verb: "성취 달성" },
};

export function relativeWhen(iso: string): string {
  const d = new Date(iso);
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (dayKey(d) === dayKey(today)) return `오늘 ${time}`;
  if (dayKey(d) === dayKey(yesterday)) return `어제 ${time}`;
  const diff = Math.round(
    (new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() -
      new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) /
      86400000
  );
  return diff < 7 ? `${diff}일 전` : `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function detail(a: Activity): string {
  switch (a.type) {
    case "lesson":
      return `${META.lesson.verb} · ${a.minutes ?? 0}분`;
    case "quiz":
    case "review":
      return `${META[a.type].verb} · ${a.score ?? 0}점`;
    default:
      return META[a.type].verb;
  }
}

/** 활동 로그 한 묶음을 시간순 목록으로 보여준다. 홈·리포트·캘린더가 공유한다. */
export function ActivityList({
  items,
  showTime = true,
  empty = "아직 기록이 없어요.",
}: {
  items: Activity[];
  showTime?: boolean;
  empty?: string;
}) {
  if (items.length === 0) {
    return <p className="py-2 text-sm text-forest-950/50">{empty}</p>;
  }
  return (
    <ul className="divide-y divide-cream-100">
      {items.map((a) => {
        const Icon = META[a.type].icon;
        const isAchievement = a.type === "achievement";
        return (
          <li key={a.id} className="flex items-center gap-3 py-3">
            <span
              className={clsx(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                isAchievement ? "bg-gold-300/25 text-gold-600" : "bg-forest-50 text-forest-600"
              )}
            >
              <Icon size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-forest-950/85">{a.label}</p>
              <p className="text-xs text-forest-950/45">{detail(a)}</p>
            </div>
            {showTime && (
              <span className="shrink-0 text-xs text-forest-950/40">{relativeWhen(a.at)}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
