import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center animate-fade-up">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream-100 text-forest-400">
        <Icon size={24} />
      </span>
      <h3 className="font-display text-lg font-semibold text-forest-950">{title}</h3>
      <p className="mt-1.5 max-w-xs text-sm text-forest-950/55">{description}</p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="btn-press mt-5 rounded-full bg-forest-800 px-5 py-2.5 text-sm font-semibold text-cream-50 transition-colors hover:bg-forest-700"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
