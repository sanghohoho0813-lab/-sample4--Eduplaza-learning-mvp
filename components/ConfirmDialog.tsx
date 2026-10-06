"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

/**
 * 되돌릴 수 없는 행동(삭제·초기화) 앞에서 한 번 더 묻는 확인 창.
 * 모바일에서는 아래에서 올라오는 시트, 데스크톱에서는 가운데 창으로 뜬다.
 * Esc·바깥 클릭은 취소, 열릴 때 '취소'에 포커스를 두어 실수로 확정되지 않게 한다.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "취소",
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const descId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  // 부모가 매번 새 함수를 넘겨도 포커스·스크롤 처리가 다시 돌지 않도록 ref로 둔다
  const cancelFn = useRef(onCancel);
  cancelFn.current = onCancel;

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        cancelFn.current();
      } else if (e.key === "Tab" && panelRef.current) {
        // 창 안에서만 포커스가 돌도록
        const items = panelRef.current.querySelectorAll<HTMLElement>("button");
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      restoreRef.current?.focus?.();
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-end justify-center sm:items-center sm:p-6">
      <button
        aria-label="닫기"
        tabIndex={-1}
        onClick={onCancel}
        className="absolute inset-0 bg-forest-950/50 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className="relative w-full rounded-t-3xl bg-white px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-6 shadow-card-hover animate-fade-up sm:max-w-md sm:rounded-3xl sm:pb-6 sm:animate-scale-in"
      >
        <h2 id={titleId} className="text-lg font-bold text-forest-950">
          {title}
        </h2>
        {description && (
          <p id={descId} className="mt-2 text-sm leading-relaxed text-forest-950/60">
            {description}
          </p>
        )}
        <div className="mt-6 grid grid-cols-2 gap-2.5">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="btn-press min-h-[52px] rounded-full border border-cream-300 bg-white text-sm font-semibold text-forest-950/75 transition-colors hover:bg-cream-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={clsx(
              "btn-press min-h-[52px] rounded-full text-sm font-bold text-white transition-colors",
              danger ? "bg-danger hover:bg-danger/90" : "bg-forest-900 hover:bg-forest-800"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
