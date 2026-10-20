// 최근 검색어 — 학습 상태와 분리된 별도 키. 검색칸을 눌렀을 때 다시 찾기 쉽게 한다.
import { COURSES } from "./data";

export const RECENT_KEY = "eduplaza-recent-searches";
const MAX_RECENT = 8;

export function readRecent(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(raw)
      ? raw.filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, MAX_RECENT)
      : [];
  } catch {
    return [];
  }
}

function write(list: string[]) {
  try {
    if (list.length === 0) localStorage.removeItem(RECENT_KEY);
    else localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    // 저장이 막혀 있어도 검색은 된다
  }
}

/** 같은 검색어는 맨 앞으로 올리고, 오래된 것부터 밀어낸다 */
export function pushRecent(query: string): string[] {
  const q = query.trim();
  if (!q) return readRecent();
  const next = [q, ...readRecent().filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, MAX_RECENT);
  write(next);
  return next;
}

export function removeRecent(query: string): string[] {
  const next = readRecent().filter((x) => x !== query);
  write(next);
  return next;
}

export function clearRecent(): string[] {
  write([]);
  return [];
}

/**
 * 많이 듣는 강의의 대표 키워드 — 수강생 수 순으로 강의를 훑으며 겹치지 않는 태그를 고른다.
 * (실제 검색 통계가 아니므로 화면에서는 '인기 강의 키워드'라고 부른다)
 */
export const POPULAR_KEYWORDS: string[] = (() => {
  const out: string[] = [];
  for (const c of [...COURSES].sort((a, b) => b.studentCount - a.studentCount)) {
    const tag = c.tags.find((t) => !out.includes(t));
    if (tag) out.push(tag);
    if (out.length === 8) break;
  }
  return out;
})();
