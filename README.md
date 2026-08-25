# EduPlaza — 온라인 교육·학습관리 반응형 웹앱 MVP

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

## Demo Mode

첫 방문 시 Demo User(지현님)가 자동 시딩됩니다 — 6개 강의 수강 중,
12일 연속 학습, 주간 학습 8시간 45분. 마이페이지 하단의
**데모 데이터 초기화** 버튼으로 언제든 초기 상태로 되돌릴 수 있습니다.

## 이미지 교체 가이드

썸네일·프로필은 현재 그라디언트 플레이스홀더로 렌더링됩니다.
실제 이미지가 준비되면 아래 경로에 넣고 `components/Thumbnail.tsx`를
`<img>` 렌더링으로 교체하면 됩니다.

- 강의 썸네일(16:9): `public/images/courses/{courseId}.jpg`
- 강사 프로필(1:1): `public/images/instructors/{instructorId}.jpg`
