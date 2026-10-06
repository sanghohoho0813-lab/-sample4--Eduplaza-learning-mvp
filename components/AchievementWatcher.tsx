"use client";

import { useEffect, useRef } from "react";
import { ACHIEVEMENTS, useStore } from "@/lib/store";
import { useToast } from "./Toast";

/**
 * 어떤 화면에서 행동했든, 새 성취가 해금되면 그 자리에서 알려준다.
 * 첫 로드 때 이미 가지고 있던 성취는 알리지 않는다.
 */
export function AchievementWatcher() {
  const { ready, state } = useStore();
  const { toast } = useToast();
  const known = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (known.current === null) {
      known.current = new Set(state.unlockedAchievements);
      return;
    }
    for (const id of state.unlockedAchievements) {
      if (known.current.has(id)) continue;
      known.current.add(id);
      const def = ACHIEVEMENTS.find((a) => a.id === id);
      if (def) toast(`새 성취 달성 · ${def.label}`, "celebrate");
    }
  }, [ready, state.unlockedAchievements, toast]);

  return null;
}
