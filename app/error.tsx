"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";

// 화면 하나가 예기치 못하게 실패해도 사이드바·탭바는 살아 있고,
// 사용자는 같은 자리에서 다시 시도하거나 홈으로 돌아갈 수 있다.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-cream-200 text-forest-700">
        <RotateCcw size={24} />
      </span>
      <h1 className="font-display text-xl font-semibold text-forest-950">
        화면을 불러오지 못했어요
      </h1>
      <p className="mt-2 max-w-sm text-sm text-forest-950/72">
        일시적인 문제일 수 있어요. 학습 기록은 그대로 저장되어 있어요.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
        <button
          onClick={reset}
          className="btn-press inline-flex min-h-[48px] items-center rounded-full bg-forest-900 px-6 text-sm font-bold text-cream-50"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="btn-press inline-flex min-h-[48px] items-center rounded-full border border-cream-300 bg-white px-6 text-sm font-semibold text-forest-950/75"
        >
          홈으로 가기
        </Link>
      </div>
      {error.digest && (
        <p className="mt-6 font-mono text-xs text-forest-950/68">오류 코드 {error.digest}</p>
      )}
    </div>
  );
}
