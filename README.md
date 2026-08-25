# EduPlaza — 온라인 교육·학습관리 반응형 웹앱 MVP

> **미래에이아이랩 (MIRAE AI LAB)** 이 기획·개발한 학습 플랫폼 레퍼런스 프로젝트입니다.
> 브랜드 로고는 `public/images/brand/`, 브랜드 상수는 `lib/brand.ts`에서 관리합니다.

온라인 강의와 자기주도 학습을 한 곳에서 관리하는 학습 플랫폼 MVP입니다.
딥 포레스트 그린 + 크림 톤의 프리미엄 러닝 플랫폼 디자인을 기준으로,
강의 탐색 → 수강 신청 → 강의 시청 → 진도 관리 → 퀴즈/과제 → 학습 리포트까지의
전체 학습 플로우가 실제로 동작합니다.

## 실행

```bash
npm install
npm run dev    # http://localhost:3000
npm run build  # 프로덕션 빌드 (Vercel 배포 가능)
```

## 기술 스택

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- lucide-react 아이콘
- 로컬 데이터 레이어 (Supabase 테이블 스키마와 동일한 구조를 localStorage에 영속화)

> MVP 단계에서는 별도 백엔드 없이 동작합니다. `lib/types.ts`가 Supabase 스키마
> (users / instructors / courses / course_sections / lessons / enrollments /
> lesson_progress / quizzes / quiz_questions / quiz_results / assignments /
> notes / reviews / favorites)를 그대로 반영하고 있어, 추후 `lib/store.tsx`의
> 액션들을 Supabase 쿼리로 교체하면 됩니다.

## 주요 화면

| 경로 | 화면 |
| --- | --- |
| `/` | 학습자 홈 대시보드 (진행률·미션·이어보기·추천) |
| `/courses` | 강의 탐색 (검색·카테고리·난이도·가격·평점·정렬 필터) |
| `/courses/[id]` | 강의 상세 (커리큘럼·강사·후기·Demo Enrollment) |
| `/my-learning` | 내 강의 (전체/진행중/완료/찜 탭) |
| `/learn/[courseId]?lesson=` | 강의 플레이어 (데모 플레이어·커리큘럼·노트·Q&A·자료) |
| `/quiz`, `/quiz/[id]` | 퀴즈 목록·풀이·결과 + 과제 제출 |
| `/report` | 성적·리포트 (주간 차트·강의별 진도·성취 배지) |
| `/calendar` | 학습 캘린더 |
| `/notes` | 학습노트 (작성·수정·삭제·레슨 연결) |
| `/my` | 마이페이지 (프로필·결제내역 Demo·알림 설정) |

## 브랜딩 (미래에이아이랩)

이 프로젝트가 미래에이아이랩의 결과물임을 다음 위치에서 표시합니다.

- **사이드바 하단** — 미래에이아이랩 로고 + "레퍼런스 프로젝트" 크레딧
- **홈 상단 브랜드 리본** — 로고 + "미래에이아이랩이 만든 학습 플랫폼 레퍼런스"
- **전 페이지 공통 푸터** — 로고 + 저작권 표기
- **사용자 프로필** — "미래에이아이랩 김팀장님" (사이드바 · 마이페이지)
- **브라우저 탭** — 파비콘(`app/icon.svg`) + 타이틀 `EduPlaza by 미래에이아이랩`

로고 자산은 `public/images/brand/`에 있습니다.

| 파일 | 용도 |
| --- | --- |
| `mirae-logo.jpg` | 지급받은 원본 (배경 포함) |
| `mirae-logo.png` | 배경을 제거한 가로형 로고 — 실제 화면에서 사용 |
| `mirae-symbol.png` | M 심볼만 분리 — 사이드바 상단 |
| `app/icon.png` | 브라우저 탭 파비콘 (심볼 + 딥네이비 배경) |

로고는 짙은 남색 워드마크라 어두운 배경에서는 대비가 부족하므로,
사이드바 크레딧에서는 흰색 판 위에 얹어 원본 색을 보존합니다.
문구·경로는 `lib/brand.ts` 한 곳에서 관리하므로 여기만 고치면 전체에 반영됩니다.

## Demo Mode

첫 방문 시 Demo User(지현님)가 자동 시딩됩니다 — 6개 강의 수강 중,
12일 연속 학습, 주간 학습 8시간 45분. 마이페이지 하단의
**데모 데이터 초기화** 버튼으로 언제든 초기 상태로 되돌릴 수 있습니다.

## UX 디테일

- **타이포그래피** — 기본 Tailwind 대비 약 1.5배 확대한 자체 스케일 (`tailwind.config.ts`).
  모바일에서는 헤딩만 한 단계 낮춰 줄바꿈이 깨지지 않도록 조정했습니다.
- **헤더 검색 자동완성** — 입력 즉시 강의·강사·카테고리·태그를 매칭해 최대 5건 제안.
  ↑↓ 이동, Enter 선택, Esc 닫기, 바깥 클릭 시 자동 닫힘.
- **퀴즈 키보드 조작** — `1`~`4`로 보기 선택, `Enter`로 정답 확인 → 다음 문제.
  문항별 진행 도트로 맞힌 문제(초록)·틀린 문제(빨강)를 한눈에 확인합니다.
- **모바일 sticky UI** — 강의 상세 하단 고정 CTA(가격/진도율 + 수강 버튼),
  강의 플레이어의 영상 상단 고정(스크롤해도 영상이 보임).
- **접근성** — 전역 `:focus-visible` 링, 44px 이상 터치 타겟, aria 라벨,
  `word-break: keep-all`로 한글 어절 단위 줄바꿈.

## 이미지 교체 가이드

썸네일·프로필은 현재 그라디언트 플레이스홀더로 렌더링됩니다.
실제 이미지가 준비되면 아래 경로에 넣고 `components/Thumbnail.tsx`를
`<img>` 렌더링으로 교체하면 됩니다.

- 강의 썸네일(16:9): `public/images/courses/{courseId}.jpg`
- 강사 프로필(1:1): `public/images/instructors/{instructorId}.jpg`
