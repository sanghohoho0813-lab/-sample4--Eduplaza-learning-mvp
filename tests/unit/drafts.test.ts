import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DRAFT_KEY, clearDrafts, readDrafts, writeDrafts } from "@/lib/drafts";

// node 환경에는 localStorage가 없으므로 최소 구현을 붙인다
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

describe("과제 초안 저장", () => {
  beforeEach(() => {
    (globalThis as { localStorage?: unknown }).localStorage = new MemoryStorage();
  });
  afterEach(() => {
    delete (globalThis as { localStorage?: unknown }).localStorage;
  });

  it("저장한 초안을 그대로 읽는다", () => {
    const d = { a1: { text: "초안", savedAt: "2026-10-20T01:00:00.000Z" } };
    writeDrafts(d);
    expect(readDrafts()).toEqual(d);
  });

  it("없는 과제·깨진 항목·깨진 JSON은 버린다", () => {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ a1: { text: "ok", savedAt: "x" }, zz: { text: "gone", savedAt: "x" }, a2: { text: 3 } })
    );
    expect(Object.keys(readDrafts())).toEqual(["a1"]);
    localStorage.setItem(DRAFT_KEY, "{not json");
    expect(readDrafts()).toEqual({});
  });

  it("비우면 키 자체를 지우고, 저장소가 없어도 오류 없이 빈 값", () => {
    writeDrafts({ a1: { text: "x", savedAt: "y" } });
    clearDrafts();
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
    delete (globalThis as { localStorage?: unknown }).localStorage;
    expect(readDrafts()).toEqual({});
    expect(() => writeDrafts({})).not.toThrow();
  });
});
