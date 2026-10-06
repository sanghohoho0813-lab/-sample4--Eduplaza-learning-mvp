import Image from "next/image";
import { BRAND } from "@/lib/brand";

// 브랜드 이미지는 원본 비율(가로형 755×147, 심볼 268×268)을 알려줘
// 레이아웃 흔들림 없이 자리를 잡고, 필요한 해상도만 내려받게 한다.
const LOGO = { width: 755, height: 147 } as const;
const SYMBOL = { width: 268, height: 268 } as const;

export function BrandLogo({
  dark = false,
  className,
  priority = false,
}: {
  /** 어두운 배경용(워드마크 크림색) */
  dark?: boolean;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={dark ? BRAND.logoDark : BRAND.logo}
      alt={`${BRAND.company} 로고`}
      width={LOGO.width}
      height={LOGO.height}
      sizes="240px"
      priority={priority}
      className={className}
    />
  );
}

/** 장식용 M 심볼 — 옆에 제품명이 함께 있으므로 스크린리더에는 숨긴다 */
export function BrandSymbol({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src={BRAND.symbol}
      alt=""
      aria-hidden
      width={SYMBOL.width}
      height={SYMBOL.height}
      sizes="48px"
      priority={priority}
      className={className}
    />
  );
}
