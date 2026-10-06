"use client";

// 루트 레이아웃까지 실패했을 때의 마지막 안전망 — 앱 셸 없이 최소한의 화면만 그린다.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#F5F2E9",
          color: "#131F19",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 8 }}>EduPlaza를 불러오지 못했어요</h1>
          <p style={{ opacity: 0.6, marginBottom: 20 }}>잠시 후 다시 시도해주세요.</p>
          <button
            onClick={reset}
            style={{
              minHeight: 48,
              padding: "0 24px",
              borderRadius: 999,
              border: 0,
              background: "#131F19",
              color: "#F5F2E9",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
