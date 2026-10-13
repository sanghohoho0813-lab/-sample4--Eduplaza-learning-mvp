"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * 화면 하단에 고정되는 바·시트처럼 뷰포트 기준으로 떠야 하는 요소용.
 * 페이지 진입 애니메이션(transform) 안에 두면 fixed가 본문 기준으로 붙어 버리므로 body로 꺼낸다.
 */
export function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? createPortal(children, document.body) : null;
}
