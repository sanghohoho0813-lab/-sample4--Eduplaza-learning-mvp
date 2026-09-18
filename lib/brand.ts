// 미래에이아이랩 브랜드 상수 — EduPlaza는 미래에이아이랩의 레퍼런스 프로젝트다.
// 로고는 투명 배경 원본 PNG를 그대로 사용한다(여백만 트리밍).
export const BRAND = {
  company: "미래에이아이랩",
  companyEn: "MIRAE AI LAB",
  companyShort: "미래AI랩", // CTA 등 짧게 부를 때
  product: "EduPlaza",
  tagline: "미래에이아이랩이 기획·개발한 학습 플랫폼 레퍼런스",
  logo: "/images/brand/mirae-logo.png", // 가로형 로고 원본 (밝은 배경용)
  logoDark: "/images/brand/mirae-logo-dark.png", // 어두운 배경용 — 심볼은 원본, 워드마크만 크림색
  symbol: "/images/brand/mirae-symbol.png", // M 심볼 (투명 배경)
} as const;

// 샘플 하단 CTA가 연결되는 외부 링크. 주소가 바뀌면 이 세 곳만 고치면 된다.
export const BRAND_LINKS = {
  consult: "https://miraeailab.com/business-diagnosis", // 우리 회사도 만들어보기
  samples: "https://miraeailab.com/business-services", // 다른 샘플 보기
  home: "https://miraeailab.com/", // 미래AI랩 홈페이지
} as const;
