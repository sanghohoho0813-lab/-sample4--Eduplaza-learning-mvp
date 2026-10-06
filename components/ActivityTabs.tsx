import Link from "next/link";
import clsx from "clsx";

export type ActivityTab = "quiz" | "assignment" | "notes" | "calendar";

const TABS: { key: ActivityTab; label: string; href: string }[] = [
  { key: "quiz", label: "퀴즈", href: "/quiz" },
  { key: "assignment", label: "과제", href: "/quiz?tab=assignment" },
  { key: "notes", label: "학습노트", href: "/notes" },
  { key: "calendar", label: "캘린더", href: "/calendar" },
];

/**
 * "학습 활동" 묶음의 공통 탭. 퀴즈·과제·노트·캘린더를 한 줄에서 오간다.
 * 모바일 하단 탭이 5칸이라 이 탭이 하위 화면 사이의 유일한 이동 수단이 된다.
 */
export function ActivityTabs({
  active,
  counts,
}: {
  active: ActivityTab;
  counts?: Partial<Record<ActivityTab, number>>;
}) {
  return (
    <nav aria-label="학습 활동" className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="inline-flex min-w-max rounded-full bg-cream-200 p-1">
        {TABS.map((t) => {
          const on = t.key === active;
          const count = counts?.[t.key];
          return (
            <Link
              key={t.key}
              href={t.href}
              aria-current={on ? "page" : undefined}
              className={clsx(
                "btn-press inline-flex min-h-[44px] items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-sm font-bold transition-colors sm:px-5",
                on ? "bg-forest-950 text-cream-50" : "text-forest-950/68 hover:text-forest-950"
              )}
            >
              {t.label}
              {count ? (
                <span
                  className={clsx(
                    "rounded-full px-1.5 text-xs",
                    on ? "bg-cream-50/15 text-cream-50" : "bg-forest-950/10 text-forest-950/70"
                  )}
                >
                  {count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
