import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  /** 링크 대신 버튼 동작이 필요할 때(필터 초기화 등) */
  children?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center animate-fade-up">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream-100 text-forest-400">
        <Icon size={24} />
      </span>
      <h3 className="font-display text-lg font-semibold text-forest-950">{title}</h3>
      <p className="mt-1.5 max-w-xs text-sm text-forest-950/68">{description}</p>
      {(children || (actionHref && actionLabel)) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {children}
          {actionHref && actionLabel && (
            <Link
              href={actionHref}
              className="btn-press inline-flex min-h-[48px] items-center rounded-full bg-forest-900 px-6 text-sm font-bold text-cream-50 transition-colors hover:bg-forest-800"
            >
              {actionLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
