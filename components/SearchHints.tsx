"use client";

import { useEffect, useState } from "react";
import { Clock, TrendingUp, X } from "lucide-react";
import { POPULAR_KEYWORDS, clearRecent, readRecent, removeRecent } from "@/lib/recentSearch";

/**
 * 검색칸을 눌렀는데 아직 아무것도 입력하지 않았을 때 — 최근 검색어와 인기 강의 키워드.
 * 고르면 onPick으로 검색어를 넘긴다(검색어 저장은 검색을 실행하는 쪽에서).
 */
export function SearchHints({ onPick, id }: { onPick: (keyword: string) => void; id?: string }) {
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => setRecent(readRecent()), []);

  return (
    <div id={id} className="space-y-5 p-4">
      {recent.length > 0 && (
        <section aria-labelledby={`${id ?? "hints"}-recent`}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 id={`${id ?? "hints"}-recent`} className="text-xs font-bold text-forest-950/72">
              최근 검색어
            </h2>
            <button
              type="button"
              onClick={() => setRecent(clearRecent())}
              className="min-h-[32px] px-1 text-xs font-semibold text-forest-950/68 hover:text-forest-950"
            >
              전체 삭제
            </button>
          </div>
          <ul className="space-y-0.5">
            {recent.map((r) => (
              <li key={r} className="flex items-center">
                <button
                  type="button"
                  onClick={() => onPick(r)}
                  className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 text-left text-sm text-forest-950 hover:bg-cream-50"
                >
                  <Clock size={15} className="shrink-0 text-forest-950/40" aria-hidden />
                  <span className="truncate">{r}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRecent(removeRecent(r))}
                  aria-label={`‘${r}’ 검색 기록 삭제`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-forest-950/50 hover:bg-cream-100 hover:text-forest-950"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section aria-labelledby={`${id ?? "hints"}-popular`}>
        <h2
          id={`${id ?? "hints"}-popular`}
          className="mb-2.5 flex items-center gap-1.5 text-xs font-bold text-forest-950/72"
        >
          <TrendingUp size={14} aria-hidden />
          인기 강의 키워드
        </h2>
        <div className="flex flex-wrap gap-2">
          {POPULAR_KEYWORDS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => onPick(k)}
              className="btn-press min-h-[36px] rounded-full border border-cream-300 bg-white px-3.5 text-sm text-forest-950/80 transition-colors hover:border-forest-300 hover:text-forest-950"
            >
              {k}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
