// 작성 중인 과제 초안. 학습 상태(eduplaza-state-v3)와 분리해 따로 둔다 —
// 화면을 떠나도 쓰던 글이 남고, 초안이 깨져도 학습 기록에는 영향이 없다.
import { ASSIGNMENTS } from "./data";

export const DRAFT_KEY = "eduplaza-assignment-drafts";

export interface Draft {
  text: string;
  savedAt: string;
}

export function readDrafts(): Record<string, Draft> {
  try {
    const raw = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "{}") as Record<string, unknown>;
    const out: Record<string, Draft> = {};
    for (const [id, v] of Object.entries(raw)) {
      const d = v as Partial<Draft> | null;
      if (d && typeof d.text === "string" && typeof d.savedAt === "string" && ASSIGNMENTS.some((a) => a.id === id)) {
        out[id] = { text: d.text, savedAt: d.savedAt };
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function writeDrafts(drafts: Record<string, Draft>) {
  try {
    if (Object.keys(drafts).length === 0) localStorage.removeItem(DRAFT_KEY);
    else localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
  } catch {
    // 저장 공간이 없거나 막혀 있어도 작성은 계속할 수 있어야 한다
  }
}

export function clearDrafts() {
  writeDrafts({});
}
