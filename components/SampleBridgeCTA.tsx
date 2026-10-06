/**
 * SampleBridgeCTA — 샘플 페이지 하단 공통 CTA 브릿지.
 *
 * 샘플을 다 본 사용자가 (1) 이 샘플을 미래AI랩이 만들었다는 것을 인지하고,
 * (2) 상담으로 넘어가고, (3) 다른 샘플·홈페이지로 이동할 수 있게 한다.
 *
 * 문구는 아래 상수에서, 링크는 lib/brand.ts의 BRAND_LINKS에서 관리한다.
 * 페이지마다 다르게 쓰고 싶으면 props로 덮어쓸 수 있다.
 */
import { ArrowUpRight, ExternalLink, Sparkles } from "lucide-react";
import clsx from "clsx";
import { BRAND, BRAND_LINKS } from "@/lib/brand";

// ---- CTA 문구 (수정은 여기서) ----
const COPY = {
  badge: `${BRAND.companyEn}`,
  eyebrow: `이 샘플은 ${BRAND.companyShort}이 기획·제작했습니다`,
  headline:
    "이 샘플이 마음에 드셨다면,\n대표님 회사도 이렇게 설계해볼 수 있습니다.",
  description: `${BRAND.companyShort}은 평범한 회사를 기술·데이터·AI 기반의 성장형 기업으로 바꾸는 AX / MVP / 플랫폼 기획·개발을 진행합니다.`,
  primary: "우리 회사도 만들어보기", // 메인 CTA — 전 샘플 공통 문구
  secondary: "다른 샘플 보기",
  tertiary: `${BRAND.companyShort} 홈페이지`,
} as const;

export interface SampleBridgeCTAProps {
  /** 메인 CTA(상담) 링크 */
  consultHref?: string;
  /** 다른 샘플 목록 링크 */
  samplesHref?: string;
  /** 홈페이지 링크 */
  homeHref?: string;
  className?: string;
}

export function SampleBridgeCTA({
  consultHref = BRAND_LINKS.consult,
  samplesHref = BRAND_LINKS.samples,
  homeHref = BRAND_LINKS.home,
  className,
}: SampleBridgeCTAProps) {
  return (
    <section
      aria-labelledby="sample-bridge-cta-heading"
      className={clsx(
        "relative overflow-hidden rounded-3xl border border-cream-300/80 bg-gradient-to-br from-teal-50 via-white to-cream-100 px-6 py-9 shadow-card md:px-10 md:py-12",
        className
      )}
    >
      {/* 아주 옅은 광원 — 배경에만, 애니메이션 없음 */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-teal-200/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-amber-100/40 blur-3xl"
      />

      <div className="relative mx-auto max-w-4xl text-center">
        {/* 1. 배지 — 은은한 shimmer */}
        <span className="relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-teal-200 bg-white/80 px-4 py-1.5 text-[16px] font-bold uppercase tracking-[0.18em] text-teal-700 shadow-sm">
          <Sparkles size={14} className="shrink-0 text-teal-500" />
          {COPY.badge}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-teal-200/50 to-transparent motion-safe:animate-badge-shimmer"
          />
        </span>

        {/* 2. 미래AI랩 소개 + 헤드라인 */}
        <p className="mt-5 text-sm font-semibold text-forest-700 md:text-base">
          {COPY.eyebrow}
        </p>
        <h2
          id="sample-bridge-cta-heading"
          className="mt-2.5 whitespace-pre-line font-display text-[25px] font-semibold leading-snug text-forest-950 sm:text-[30px] md:text-[34px]"
        >
          {COPY.headline}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-forest-950/72 md:text-base">
          {COPY.description}
        </p>

        {/* 3. 메인 CTA — subtle gradient + 5초 주기 light sweep + hover lift */}
        <div className="mt-8">
          <a
            href={consultHref}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex min-h-[60px] w-full items-center justify-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-forest-900 via-forest-800 to-teal-700 px-9 text-[17px] font-bold text-cream-50 shadow-[0_6px_20px_rgba(19,31,25,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(31,99,114,0.32)] focus-visible:-translate-y-0.5 sm:w-auto sm:text-lg"
          >
            <span className="relative z-10">{COPY.primary}</span>
            <ArrowUpRight
              size={20}
              className="relative z-10 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
            {/* light sweep */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent motion-safe:animate-cta-sweep"
            />
          </a>
        </div>

        {/* 4. 서브 액션 — 메인보다 확실히 낮은 위계 */}
        <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-2">
          <a
            href={samplesHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-1.5 rounded-full border border-cream-300 bg-white/70 px-5 text-sm font-semibold text-forest-800 transition-colors hover:border-teal-300 hover:bg-white sm:w-auto"
          >
            {COPY.secondary}
            <ArrowUpRight size={15} className="shrink-0 opacity-60" />
          </a>
          <a
            href={homeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[48px] items-center justify-center gap-1.5 px-4 text-sm font-semibold text-forest-950/68 underline-offset-4 transition-colors hover:text-forest-800 hover:underline"
          >
            {COPY.tertiary}
            <ExternalLink size={14} className="shrink-0 opacity-60" />
          </a>
        </div>
      </div>
    </section>
  );
}
