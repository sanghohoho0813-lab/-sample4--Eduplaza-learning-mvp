import clsx from "clsx";

export function ProgressBar({
  value,
  className,
  trackClass = "bg-cream-200",
  fillClass = "bg-forest-600",
  height = "h-2",
  animate = true,
}: {
  value: number; // 0-100
  className?: string;
  trackClass?: string;
  fillClass?: string;
  height?: string;
  animate?: boolean;
}) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div
      className={clsx("w-full overflow-hidden rounded-full", height, trackClass, className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={clsx(
          "h-full rounded-full transition-all duration-500",
          fillClass,
          animate && "animate-progress"
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function ProgressRing({
  value,
  size = 64,
  stroke = 6,
  trackColor = "#EDE8DA",
  color = "#345441",
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  trackColor?: string;
  color?: string;
  children?: React.ReactNode;
}) {
  const pct = Math.min(100, Math.max(0, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
