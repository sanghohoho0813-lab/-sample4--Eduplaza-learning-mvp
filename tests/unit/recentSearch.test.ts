import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POPULAR_KEYWORDS, RECENT_KEY, clearRecent, pushRecent, readRecent, removeRecent } from "@/lib/recentSearch";
import { COURSES, getCategory, getInstructor } from "@/lib/data";

class MemoryStorage {
  private m = new Map<string, string>();
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, String(v));
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
}

describe("최근 검색어", () => {
  beforeEach(() => {
    (globalThis as { localStorage?: unknown }).localStorage = new MemoryStorage();
  });
  afterEach(() => {
    delete (globalThis as { localStorage?: unknown }).localStorage;
  });

  it("최근 것이 앞, 같은 검색어(대소문자 무시)는 하나로, 최대 8개", () => {
    pushRecent("sql");
    pushRecent("Python");
    expect(pushRecent("SQL")).toEqual(["SQL", "Python"]);
    for (let i = 0; i < 10; i++) pushRecent(`키워드${i}`);
    expect(readRecent()).toHaveLength(8);
    expect(readRecent()[0]).toBe("키워드9");
  });

  it("빈 검색어는 저장하지 않고, 지우기·전체 삭제가 된다", () => {
    pushRecent("   ");
    expect(readRecent()).toEqual([]);
    pushRecent("A");
    pushRecent("B");
    expect(removeRecent("A")).toEqual(["B"]);
    clearRecent();
    expect(localStorage.getItem(RECENT_KEY)).toBeNull();
  });

  it("깨진 값은 빈 목록으로", () => {
    localStorage.setItem(RECENT_KEY, "{oops");
    expect(readRecent()).toEqual([]);
    localStorage.setItem(RECENT_KEY, JSON.stringify(["ok", 3, ""]));
    expect(readRecent()).toEqual(["ok"]);
  });
});

describe("인기 강의 키워드", () => {
  it("8개, 겹치지 않고, 누르면 실제로 강의가 하나 이상 찾아진다", () => {
    expect(POPULAR_KEYWORDS).toHaveLength(8);
    expect(new Set(POPULAR_KEYWORDS).size).toBe(8);
    for (const k of POPULAR_KEYWORDS) {
      const hits = COURSES.filter((c) =>
        [c.title, c.subtitle, getInstructor(c.instructorId)?.name ?? "", getCategory(c.categoryId)?.name ?? "", ...c.tags]
          .join(" ")
          .toLowerCase()
          .includes(k.toLowerCase())
      );
      expect(hits.length, k).toBeGreaterThan(0);
    }
  });
});
