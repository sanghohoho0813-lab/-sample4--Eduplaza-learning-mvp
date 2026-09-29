import type {
  Assignment,
  Category,
  Course,
  CourseLevel,
  CourseSection,
  Instructor,
  Lesson,
  Quiz,
  Review,
} from "./types";

export const CATEGORIES: Category[] = [
  { id: "dev", name: "개발" },
  { id: "ai", name: "AI" },
  { id: "data", name: "데이터" },
  { id: "design", name: "디자인" },
  { id: "marketing", name: "마케팅" },
  { id: "business", name: "비즈니스" },
  { id: "career", name: "커리어" },
  { id: "language", name: "외국어" },
];


export const LEVEL_LABEL: Record<CourseLevel, string> = {
  beginner: "입문",
  intermediate: "중급",
  advanced: "고급",
};

export const INSTRUCTORS: Instructor[] = [
  {
    id: "inst-1",
    name: "김도현",
    title: "데이터 분석가 · 前 커머스 데이터팀 리드",
    bio: "10년간 커머스와 핀테크에서 데이터 분석 조직을 이끌었습니다. 현업에서 바로 쓰이는 분석 사고와 도구 사용법을 쉽게 풀어 전달합니다.",
    field: "data",
  },
  {
    id: "inst-2",
    name: "박서연",
    title: "AI 프로덕트 컨설턴트",
    bio: "기업 대상 생성형 AI 도입 컨설팅을 진행하며, 실무자가 오늘 바로 적용할 수 있는 AI 활용법을 강의합니다.",
    field: "ai",
  },
  {
    id: "inst-3",
    name: "이하린",
    title: "프로덕트 디자이너 · 디자인 시스템 스페셜리스트",
    bio: "스타트업과 대기업을 오가며 프로덕트 디자인과 디자인 시스템을 구축했습니다. 원리 중심의 디자인 교육을 지향합니다.",
    field: "design",
  },
  {
    id: "inst-4",
    name: "정민수",
    title: "풀스택 개발자 · 개발 교육 크리에이터",
    bio: "비전공자 대상 프로그래밍 교육 경력 8년. '처음 배우는 사람의 눈높이'를 가장 중요하게 생각합니다.",
    field: "dev",
  },
  {
    id: "inst-5",
    name: "한지우",
    title: "그로스 마케터 · 마케팅 에이전시 대표",
    bio: "데이터 기반 그로스 마케팅으로 30개 이상의 브랜드 성장을 도왔습니다. 이론보다 실행 중심의 강의를 합니다.",
    field: "marketing",
  },
  {
    id: "inst-6",
    name: "오세라",
    title: "비즈니스 영어 코치 · 통번역 전문가",
    bio: "글로벌 기업 임원 대상 비즈니스 영어 코칭 12년. 실전 상황에서 바로 쓰는 표현 위주로 훈련합니다.",
    field: "language",
  },
  {
    id: "inst-7",
    name: "임태윤",
    title: "스타트업 액셀러레이터 파트너",
    bio: "초기 스타트업 60여 팀의 비즈니스 모델 설계와 투자 유치를 도왔습니다. 창업 현장의 살아있는 사례로 강의합니다.",
    field: "business",
  },
  {
    id: "inst-8",
    name: "송가은",
    title: "커리어 코치 · HR 컨설턴트",
    bio: "대기업 인사팀 출신 커리어 코치. 이직·포트폴리오·면접까지 커리어 전환의 전 과정을 함께합니다.",
    field: "career",
  },
];

// ---------- 커리큘럼 빌더 ----------

type LessonDef = [title: string, durationMin: number];
type SectionDef = [title: string, lessons: LessonDef[]];

function buildSections(courseId: string, defs: SectionDef[]): CourseSection[] {
  return defs.map(([title, lessonDefs], si) => {
    const sectionId = `${courseId}-s${si + 1}`;
    const lessons: Lesson[] = lessonDefs.map(([lt, dur], li) => ({
      id: `${sectionId}-l${li + 1}`,
      sectionId,
      courseId,
      order: li + 1,
      title: lt,
      durationMin: dur,
    }));
    return { id: sectionId, courseId, order: si + 1, title, lessons };
  });
}

function totalMinutes(sections: CourseSection[]): number {
  return sections.reduce(
    (sum, s) => sum + s.lessons.reduce((a, l) => a + l.durationMin, 0),
    0
  );
}

interface CourseSeed {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  categoryId: Course["categoryId"];
  instructorId: string;
  level: CourseLevel;
  price: number;
  rating: number;
  reviewCount: number;
  studentCount: number;
  thumbnailTone: number;
  tags: string[];
  goals: string[];
  requirements: string[];
  curriculum: SectionDef[];
}

function makeCourse(seed: CourseSeed): Course {
  const sections = buildSections(seed.id, seed.curriculum);
  return { ...seed, sections, totalMinutes: totalMinutes(sections) };
}

// ---------- 강의 18개 ----------

export const COURSES: Course[] = [
  makeCourse({
    id: "c1",
    title: "데이터 분석 입문 with Python",
    subtitle: "실무 데이터로 배우는 데이터 분석의 첫걸음",
    description:
      "엑셀만 쓰던 실무자도 Python으로 데이터를 다룰 수 있게 됩니다. 실제 커머스 판매 데이터를 활용해 데이터 수집부터 정제, 탐색적 분석, 시각화, 리포트 작성까지 분석의 전 과정을 경험합니다.",
    categoryId: "data",
    instructorId: "inst-1",
    level: "beginner",
    price: 88000,
    rating: 4.8,
    reviewCount: 214,
    studentCount: 3821,
    thumbnailTone: 0,
    tags: ["Python", "Pandas", "데이터 시각화"],
    goals: [
      "엑셀을 넘어 데이터 분석 역량을 키우고 싶은 직장인",
      "데이터 직무 취업을 준비하는 취업 준비생",
      "Python을 실무 데이터로 처음 배워보고 싶은 분",
    ],
    requirements: ["프로그래밍 경험 불필요", "노트북과 학습 의지만 있으면 충분해요"],
    curriculum: [
      [
        "데이터 분석이란?",
        [
          ["데이터 분석의 개념과 활용 사례", 12],
          ["정형 데이터와 비정형 데이터", 10],
          ["데이터 분석 프로세스 한눈에 보기", 14],
        ],
      ],
      [
        "Python 기초 다지기",
        [
          ["개발 환경 준비하기 (Colab)", 9],
          ["변수와 자료형, 리스트 다루기", 16],
          ["조건문과 반복문으로 데이터 다루기", 18],
        ],
      ],
      [
        "Pandas로 데이터 다루기",
        [
          ["DataFrame 이해하기", 15],
          ["데이터 불러오기와 저장하기", 12],
          ["탐색적 데이터 분석(EDA) 실습", 22],
          ["결측치와 이상치 처리", 17],
        ],
      ],
      [
        "시각화와 리포트",
        [
          ["Matplotlib로 차트 그리기", 18],
          ["판매 데이터 분석 리포트 만들기", 24],
        ],
      ],
    ],
  }),
  makeCourse({
    id: "c2",
    title: "생성형 AI 업무 활용 마스터",
    subtitle: "ChatGPT부터 이미지 생성까지, 일 잘하는 사람들의 AI 사용법",
    description:
      "생성형 AI를 업무에 녹여내는 구체적인 방법을 배웁니다. 프롬프트 설계 원칙부터 문서 작성, 데이터 정리, 기획 아이데이션까지 직군별 활용 시나리오를 실습 중심으로 다룹니다.",
    categoryId: "ai",
    instructorId: "inst-2",
    level: "beginner",
    price: 66000,
    rating: 4.9,
    reviewCount: 187,
    studentCount: 5240,
    thumbnailTone: 1,
    tags: ["ChatGPT", "프롬프트", "업무 자동화"],
    goals: [
      "AI로 업무 생산성을 높이고 싶은 모든 직장인",
      "생성형 AI를 처음 접하는 입문자",
      "팀에 AI 활용 문화를 도입하고 싶은 리더",
    ],
    requirements: ["별도 준비물 없음", "무료 버전 ChatGPT로도 수강 가능"],
    curriculum: [
      [
        "생성형 AI 이해하기",
        [
          ["생성형 AI는 어떻게 동작할까?", 13],
          ["할 수 있는 일과 못하는 일 구분하기", 11],
        ],
      ],
      [
        "프롬프트 설계의 기술",
        [
          ["좋은 프롬프트의 5가지 원칙", 16],
          ["역할·맥락·형식 지정하기", 14],
          ["프롬프트 개선 실습", 18],
        ],
      ],
      [
        "직군별 업무 활용",
        [
          ["보고서·이메일 작성 자동화", 15],
          ["회의록 요약과 액션 아이템 추출", 12],
          ["기획 아이데이션과 리서치", 17],
        ],
      ],
    ],
  }),
  makeCourse({
    id: "c3",
    title: "UX/UI 디자인 기초",
    subtitle: "사용자를 이해하는 디자인, 원리부터 Figma 실습까지",
    description:
      "좋은 디자인은 감각이 아니라 원리에서 나옵니다. UX 리서치, 정보 구조, 시각 디자인 원칙을 배우고 Figma로 모바일 앱 화면을 직접 디자인해봅니다.",
    categoryId: "design",
    instructorId: "inst-3",
    level: "beginner",
    price: 77000,
    rating: 4.7,
    reviewCount: 156,
    studentCount: 2710,
    thumbnailTone: 2,
    tags: ["Figma", "UX 리서치", "UI 디자인"],
    goals: [
      "디자인 직무로 전환을 준비하는 분",
      "개발자·기획자 중 디자인 이해도를 높이고 싶은 분",
      "Figma를 처음 배우는 입문자",
    ],
    requirements: ["Figma 무료 계정", "디자인 경험 불필요"],
    curriculum: [
      [
        "UX 디자인의 기본",
        [
          ["UX와 UI, 무엇이 다를까?", 11],
          ["사용자 리서치와 페르소나", 15],
          ["정보 구조와 사용자 흐름 설계", 16],
        ],
      ],
      [
        "UI 디자인 원칙",
        [
          ["타이포그래피와 컬러의 기본", 14],
          ["레이아웃과 그리드 시스템", 13],
          ["컴포넌트 기반 디자인 사고", 12],
        ],
      ],
      [
        "Figma 실습",
        [
          ["Figma 핵심 기능 익히기", 18],
          ["모바일 홈 화면 디자인 실습", 25],
        ],
      ],
    ],
  }),
  makeCourse({
    id: "c4",
    title: "실무 Excel 데이터 분석",
    subtitle: "피벗테이블부터 대시보드까지, 엑셀 하나로 끝내는 실무 분석",
    description:
      "매일 쓰는 엑셀을 제대로 쓰면 분석 도구가 됩니다. 함수, 피벗테이블, 조건부 서식, 간단한 대시보드 제작까지 실무 데이터로 바로 써먹는 기술을 배웁니다.",
    categoryId: "data",
    instructorId: "inst-1",
    level: "beginner",
    price: 55000,
    rating: 4.6,
    reviewCount: 98,
    studentCount: 1980,
    thumbnailTone: 3,
    tags: ["Excel", "피벗테이블", "대시보드"],
    goals: ["엑셀 실력을 한 단계 올리고 싶은 직장인", "데이터 정리에 시간을 뺏기는 실무자"],
    requirements: ["Excel 2016 이상 또는 구글 시트"],
    curriculum: [
      [
        "엑셀 데이터 다루기",
        [
          ["실무 데이터 정리의 원칙", 12],
          ["필수 함수 10선 (VLOOKUP, IF, SUMIFS)", 20],
          ["데이터 유효성 검사와 오류 잡기", 13],
        ],
      ],
      [
        "피벗테이블과 대시보드",
        [
          ["피벗테이블로 요약 분석하기", 18],
          ["차트와 조건부 서식 활용", 14],
          ["월간 실적 대시보드 만들기", 22],
        ],
      ],
    ],
  }),
  makeCourse({
    id: "c5",
    title: "비즈니스 영어 실전 회화",
    subtitle: "회의·이메일·협상, 실무 상황 그대로 훈련하는 영어",
    description:
      "문법 공부는 그만, 실무 상황별 표현을 통째로 익힙니다. 화상회의 발언, 이메일 작성, 일정 조율, 협상까지 오늘 회사에서 바로 쓰는 영어를 훈련합니다.",
    categoryId: "language",
    instructorId: "inst-6",
    level: "intermediate",
    price: 72000,
    rating: 4.7,
    reviewCount: 121,
    studentCount: 1540,
    thumbnailTone: 4,
    tags: ["비즈니스 영어", "회화", "이메일"],
    goals: ["영어로 일해야 하는 직장인", "해외 협업이 잦은 실무자"],
    requirements: ["기초 영문법 이해", "중학교 수준 어휘"],
    curriculum: [
      [
        "미팅 영어",
        [
          ["회의 시작과 진행 표현", 14],
          ["의견 제시와 반대 표현", 15],
          ["화상회의 필수 표현", 12],
        ],
      ],
      [
        "이메일과 협상",
        [
          ["비즈니스 이메일 구조와 톤", 16],
          ["요청·거절·팔로업 이메일", 15],
          ["협상과 일정 조율 표현", 14],
        ],
      ],
    ],
  }),
  makeCourse({
    id: "c6",
    title: "디지털 마케팅 입문",
    subtitle: "채널 이해부터 첫 캠페인 설계까지, 마케팅의 큰 그림",
    description:
      "검색, SNS, 콘텐츠, 퍼포먼스까지 디지털 마케팅의 전체 지도를 그립니다. 채널별 특성을 이해하고 작은 예산으로 첫 캠페인을 설계·실행하는 방법을 배웁니다.",
    categoryId: "marketing",
    instructorId: "inst-5",
    level: "beginner",
    price: 60000,
    rating: 4.5,
    reviewCount: 87,
    studentCount: 2130,
    thumbnailTone: 5,
    tags: ["디지털 마케팅", "SNS", "캠페인"],
    goals: ["마케팅 직무 입문자", "1인 브랜드·소상공인 운영자"],
    requirements: ["별도 준비물 없음"],
    curriculum: [
      [
        "디지털 마케팅의 지도",
        [
          ["디지털 마케팅 채널 한눈에 보기", 13],
          ["고객 여정과 퍼널 이해하기", 14],
          ["우리 브랜드에 맞는 채널 고르기", 12],
        ],
      ],
      [
        "첫 캠페인 만들기",
        [
          ["타겟과 메시지 설계", 15],
          ["소액 광고 캠페인 세팅 실습", 18],
          ["성과 지표 읽는 법", 13],
        ],
      ],
    ],
  }),
  makeCourse({
    id: "c7",
    title: "초보자를 위한 Python",
    subtitle: "비전공자도 4주면 충분한 프로그래밍 첫 언어",
    description:
      "프로그래밍이 처음이어도 괜찮습니다. 변수부터 함수, 파일 처리, 간단한 자동화 스크립트까지 하나씩 따라 하며 코딩의 기본기를 완성합니다.",
    categoryId: "dev",
    instructorId: "inst-4",
    level: "beginner",
    price: 49000,
    rating: 4.8,
    reviewCount: 265,
    studentCount: 6120,
    thumbnailTone: 1,
    tags: ["Python", "프로그래밍 기초", "자동화"],
    goals: ["프로그래밍을 처음 시작하는 분", "개발자와 협업하는 비개발 직군"],
    requirements: ["컴퓨터 기본 사용 능력"],
    curriculum: [
      [
        "Python 시작하기",
        [
          ["개발 환경 설치와 첫 코드", 10],
          ["변수와 자료형", 14],
          ["문자열 다루기", 13],
        ],
      ],
      [
        "코드에 논리 담기",
        [
          ["조건문으로 분기하기", 15],
          ["반복문으로 일 시키기", 16],
          ["함수로 코드 정리하기", 17],
        ],
      ],
      [
        "실전 미니 프로젝트",
        [
          ["파일 읽고 쓰기", 14],
          ["폴더 정리 자동화 스크립트 만들기", 20],
        ],
      ],
    ],
  }),
  makeCourse({
    id: "c8",
    title: "스타트업 비즈니스 모델 설계",
    subtitle: "아이디어를 수익으로 바꾸는 BM 설계의 정석",
    description:
      "좋은 아이디어가 좋은 사업이 되려면 비즈니스 모델이 필요합니다. 린 캔버스 작성, 고객 검증, 수익 구조 설계, 투자 유치용 스토리 구성까지 실전 창업 프로세스를 다룹니다.",
    categoryId: "business",
    instructorId: "inst-7",
    level: "intermediate",
    price: 95000,
    rating: 4.6,
    reviewCount: 64,
    studentCount: 880,
    thumbnailTone: 2,
    tags: ["창업", "린 캔버스", "IR"],
    goals: ["예비 창업자·초기 창업팀", "신사업 기획 담당자"],
    requirements: ["사업 아이디어가 있으면 더 좋아요"],
    curriculum: [
      [
        "비즈니스 모델의 기본",
        [
          ["비즈니스 모델이란 무엇인가", 14],
          ["린 캔버스 작성 실습", 18],
          ["고객 문제 정의와 검증", 16],
        ],
      ],
      [
        "수익화와 IR",
        [
          ["수익 모델 유형과 가격 설계", 17],
          ["시장 규모 추정하기", 13],
          ["투자자를 설득하는 IR 스토리", 19],
        ],
      ],
    ],
  }),
  makeCourse({
    id: "c9",
    title: "SQL로 배우는 데이터 분석",
    subtitle: "현업 데이터베이스에서 원하는 데이터를 직접 꺼내는 힘",
    description:
      "데이터팀에 요청하지 않고 직접 데이터를 꺼내 분석할 수 있게 됩니다. SELECT 기초부터 JOIN, 집계, 서브쿼리, 실전 분석 쿼리 패턴까지 단계적으로 학습합니다.",
    categoryId: "data",
    instructorId: "inst-1",
    level: "intermediate",
    price: 79000,
    rating: 4.8,
    reviewCount: 143,
    studentCount: 2450,
    thumbnailTone: 3,
    tags: ["SQL", "데이터베이스", "쿼리"],
    goals: ["데이터 기반으로 일하고 싶은 기획자·마케터", "데이터 분석가 취업 준비생"],
    requirements: ["데이터베이스 사전 지식 불필요"],
    curriculum: [
      [
        "SQL 첫걸음",
        [
          ["데이터베이스와 테이블 이해", 12],
          ["SELECT로 데이터 조회하기", 15],
          ["WHERE로 조건 걸기", 14],
        ],
      ],
      [
        "데이터 요약과 결합",
        [
          ["GROUP BY와 집계 함수", 17],
          ["JOIN으로 테이블 연결하기", 20],
          ["서브쿼리 활용", 16],
        ],
      ],
      [
        "실전 분석 쿼리",
        [
          ["리텐션·퍼널 분석 쿼리 패턴", 21],
          ["매출 분석 리포트 쿼리 실습", 19],
        ],
      ],
    ],
  }),
  makeCourse({
    id: "c10",
    title: "설득력 있는 프레젠테이션 스킬",
    subtitle: "보고·발표가 두렵지 않은 사람들의 스토리텔링 공식",
    description:
      "발표는 재능이 아니라 구조입니다. 메시지 설계, 슬라이드 구성, 전달력 훈련까지 실제 발표 상황을 기준으로 설득의 기술을 익힙니다.",
    categoryId: "career",
    instructorId: "inst-8",
    level: "beginner",
    price: 45000,
    rating: 4.5,
    reviewCount: 72,
    studentCount: 1320,
    thumbnailTone: 4,
    tags: ["발표", "스토리텔링", "보고"],
    goals: ["보고와 발표가 잦은 직장인", "발표 불안을 극복하고 싶은 분"],
    requirements: ["별도 준비물 없음"],
    curriculum: [
      [
        "메시지 설계",
        [
          ["청중 분석과 핵심 메시지", 13],
          ["스토리라인 구조 잡기", 15],
        ],
      ],
      [
        "슬라이드와 전달",
        [
          ["한눈에 읽히는 슬라이드 원칙", 14],
          ["목소리·시선·제스처 훈련", 12],
          ["질의응답 대처법", 11],
        ],
      ],
    ],
  }),
  makeCourse({
    id: "c11",
    title: "ChatGPT 업무 자동화",
    subtitle: "반복 업무를 절반으로 줄이는 실전 자동화 레시피",
    description:
      "매일 반복하는 업무를 AI로 자동화합니다. 프롬프트 템플릿 구축, 문서 자동 생성, 데이터 정리 자동화, 노코드 도구 연동까지 실무 레시피를 그대로 따라 하며 배웁니다.",
    categoryId: "ai",
    instructorId: "inst-2",
    level: "intermediate",
    price: 68000,
    rating: 4.7,
    reviewCount: 109,
    studentCount: 1870,
    thumbnailTone: 0,
    tags: ["ChatGPT", "자동화", "노코드"],
    goals: ["반복 업무에 지친 실무자", "AI 자동화를 팀에 도입하고 싶은 분"],
    requirements: ["ChatGPT 기본 사용 경험"],
    curriculum: [
      [
        "자동화 설계",
        [
          ["자동화할 업무 찾아내기", 12],
          ["나만의 프롬프트 템플릿 만들기", 16],
          ["주간 보고서 자동 생성 실습", 18],
        ],
      ],
      [
        "도구 연동",
        [
          ["스프레드시트 데이터 정리 자동화", 17],
          ["노코드 도구로 워크플로 만들기", 20],
          ["자동화 유지보수와 한계 이해", 11],
        ],
      ],
    ],
  }),
  makeCourse({
    id: "c12",
    title: "고객 데이터 분석과 그로스 마케팅",
    subtitle: "데이터로 성장을 설계하는 그로스 실무 프레임워크",
    description:
      "감이 아닌 데이터로 마케팅합니다. AARRR 프레임워크, 코호트 분석, A/B 테스트 설계, 지표 대시보드 구축까지 그로스 마케팅의 실무 사이클을 완성합니다.",
    categoryId: "marketing",
    instructorId: "inst-5",
    level: "intermediate",
    price: 85000,
    rating: 4.6,
    reviewCount: 58,
    studentCount: 940,
    thumbnailTone: 5,
    tags: ["그로스", "AARRR", "A/B 테스트"],
    goals: ["데이터 기반 마케팅을 배우고 싶은 마케터", "스타트업 그로스 담당자"],
    requirements: ["마케팅 기본 용어 이해"],
    curriculum: [
      [
        "그로스의 기본기",
        [
          ["AARRR 퍼널 프레임워크", 15],
          ["북극성 지표 정하기", 13],
          ["코호트 분석 이해하기", 16],
        ],
      ],
      [
        "실험과 개선",
        [
          ["A/B 테스트 설계와 해석", 18],
          ["리텐션 개선 전략", 15],
          ["그로스 대시보드 만들기", 17],
        ],
      ],
    ],
  }),
  makeCourse({
    id: "c13",
    title: "React로 시작하는 웹 개발",
    subtitle: "컴포넌트 사고로 배우는 모던 프론트엔드",
    description:
      "HTML/CSS 기초가 있다면 React로 진짜 웹 서비스를 만들 수 있습니다. 컴포넌트, 상태 관리, API 연동까지 투두앱과 대시보드를 직접 만들며 배웁니다.",
    categoryId: "dev",
    instructorId: "inst-4",
    level: "intermediate",
    price: 92000,
    rating: 4.7,
    reviewCount: 134,
    studentCount: 2280,
    thumbnailTone: 2,
    tags: ["React", "프론트엔드", "JavaScript"],
    goals: ["프론트엔드 개발자 지망생", "JS 기초를 끝낸 학습자"],
    requirements: ["HTML/CSS 기초", "JavaScript 기본 문법"],
    curriculum: [
      [
        "React 기본기",
        [
          ["React가 해결하는 문제", 12],
          ["컴포넌트와 Props", 17],
          ["State와 이벤트 처리", 18],
        ],
      ],
      [
        "실전 앱 만들기",
        [
          ["투두앱 만들기", 24],
          ["API 연동과 데이터 로딩", 19],
          ["미니 대시보드 프로젝트", 26],
        ],
      ],
    ],
  }),
  makeCourse({
    id: "c14",
    title: "Figma 실무 디자인 시스템",
    subtitle: "혼자서도 팀처럼, 확장 가능한 디자인 시스템 구축",
    description:
      "일관된 프로덕트 디자인의 비밀은 디자인 시스템입니다. 컴포넌트 설계, 배리언트, 토큰, 문서화까지 Figma로 실무 수준의 디자인 시스템을 구축합니다.",
    categoryId: "design",
    instructorId: "inst-3",
    level: "intermediate",
    price: 82000,
    rating: 4.8,
    reviewCount: 91,
    studentCount: 1150,
    thumbnailTone: 0,
    tags: ["Figma", "디자인 시스템", "컴포넌트"],
    goals: ["실무 디자이너", "디자인 시스템을 도입하려는 팀"],
    requirements: ["Figma 기본 사용 경험"],
    curriculum: [
      [
        "디자인 시스템 설계",
        [
          ["디자인 시스템의 구조 이해", 14],
          ["컬러·타이포 토큰 정의하기", 16],
          ["그리드와 스페이싱 규칙", 12],
        ],
      ],
      [
        "컴포넌트 구축",
        [
          ["버튼 컴포넌트와 배리언트", 18],
          ["폼·카드 컴포넌트 만들기", 20],
          ["시스템 문서화와 운영", 13],
        ],
      ],
    ],
  }),
  makeCourse({
    id: "c15",
    title: "브랜드 마케팅 전략",
    subtitle: "선택받는 브랜드는 무엇이 다른가",
    description:
      "브랜드는 로고가 아니라 인식의 싸움입니다. 포지셔닝, 브랜드 스토리, 메시지 체계, 채널 전략까지 사랑받는 브랜드를 만드는 전략 프레임을 배웁니다.",
    categoryId: "marketing",
    instructorId: "inst-5",
    level: "intermediate",
    price: 75000,
    rating: 4.5,
    reviewCount: 47,
    studentCount: 760,
    thumbnailTone: 1,
    tags: ["브랜딩", "포지셔닝", "전략"],
    goals: ["브랜드 담당 마케터", "자기 브랜드를 만드는 창업자"],
    requirements: ["별도 준비물 없음"],
    curriculum: [
      [
        "브랜드 전략의 뼈대",
        [
          ["브랜드란 무엇인가", 13],
          ["포지셔닝 맵 그리기", 15],
          ["브랜드 스토리 설계", 16],
        ],
      ],
      [
        "브랜드 실행",
        [
          ["메시지 하우스 만들기", 14],
          ["채널별 브랜드 경험 설계", 15],
        ],
      ],
    ],
  }),
  makeCourse({
    id: "c16",
    title: "재무제표 읽는 법",
    subtitle: "숫자에 약해도 괜찮은 회계 문해력 수업",
    description:
      "재무제표는 기업의 언어입니다. 손익계산서, 재무상태표, 현금흐름표를 사례 중심으로 읽어내며 투자와 실무 의사결정에 필요한 회계 문해력을 기릅니다.",
    categoryId: "business",
    instructorId: "inst-7",
    level: "beginner",
    price: 52000,
    rating: 4.6,
    reviewCount: 83,
    studentCount: 1490,
    thumbnailTone: 3,
    tags: ["회계", "재무제표", "투자"],
    goals: ["재무 지식이 필요한 비재무 직군", "주식 투자자"],
    requirements: ["회계 사전 지식 불필요"],
    curriculum: [
      [
        "재무제표의 구조",
        [
          ["재무제표가 말해주는 것", 12],
          ["손익계산서 읽기", 16],
          ["재무상태표 읽기", 16],
        ],
      ],
      [
        "숫자로 기업 보기",
        [
          ["현금흐름표와 흑자도산", 14],
          ["핵심 재무비율 5가지", 15],
          ["실제 기업 사례 분석", 18],
        ],
      ],
    ],
  }),
  makeCourse({
    id: "c17",
    title: "이직을 위한 커리어 포트폴리오",
    subtitle: "경력을 성과로 증명하는 포트폴리오·이력서 완성",
    description:
      "같은 경력도 정리하는 방식에 따라 다르게 보입니다. 성과 중심 경력 기술, 포트폴리오 구조화, 이력서 작성, 면접 스토리텔링까지 이직 준비의 전 과정을 다룹니다.",
    categoryId: "career",
    instructorId: "inst-8",
    level: "beginner",
    price: 58000,
    rating: 4.7,
    reviewCount: 95,
    studentCount: 1680,
    thumbnailTone: 5,
    tags: ["이직", "포트폴리오", "이력서"],
    goals: ["이직을 준비하는 3~10년차 직장인", "첫 포트폴리오를 만드는 주니어"],
    requirements: ["본인의 경력 정리 자료"],
    curriculum: [
      [
        "경력의 재구성",
        [
          ["성과 중심으로 경력 정리하기", 15],
          ["STAR 기법으로 스토리 만들기", 14],
        ],
      ],
      [
        "포트폴리오와 면접",
        [
          ["직무별 포트폴리오 구조", 17],
          ["서류 통과율을 높이는 이력서", 15],
          ["면접에서 포트폴리오 활용하기", 13],
        ],
      ],
    ],
  }),
  makeCourse({
    id: "c18",
    title: "파이썬 머신러닝 첫걸음",
    subtitle: "수학 걱정 없이 시작하는 머신러닝 입문",
    description:
      "머신러닝의 핵심 개념을 직관적으로 이해하고 scikit-learn으로 예측 모델을 직접 만들어봅니다. 분류·회귀·군집화까지 실습 중심으로 배우는 ML 입문 과정입니다.",
    categoryId: "ai",
    instructorId: "inst-2",
    level: "intermediate",
    price: 98000,
    rating: 4.6,
    reviewCount: 76,
    studentCount: 1230,
    thumbnailTone: 4,
    tags: ["머신러닝", "scikit-learn", "Python"],
    goals: ["데이터 분석 다음 단계를 원하는 분", "AI 개발 입문자"],
    requirements: ["Python 기초 문법", "Pandas 기본 사용법"],
    curriculum: [
      [
        "머신러닝 이해하기",
        [
          ["머신러닝의 종류와 원리", 15],
          ["데이터 전처리의 기본", 17],
          ["학습과 평가 프로세스", 14],
        ],
      ],
      [
        "모델 만들기",
        [
          ["분류 모델 만들기", 20],
          ["회귀 모델 만들기", 18],
          ["고객 이탈 예측 미니 프로젝트", 24],
        ],
      ],
    ],
  }),
];

// ---------- 퀴즈 3세트 / 21문항 ----------

export const QUIZZES: Quiz[] = [
  {
    id: "q1",
    courseId: "c1",
    title: "데이터 분석 기초 다지기",
    description: "데이터 분석 입문 과정의 핵심 개념을 점검해보세요.",
    questions: [
      {
        id: "q1-1",
        topic: "데이터 종류",
        question: "다음 중 정형 데이터의 예시로 가장 적절한 것은?",
        options: [
          "고객 인터뷰 녹음 파일",
          "엑셀로 정리된 월별 매출 표",
          "SNS에 올라온 상품 후기 사진",
          "유튜브 영상 콘텐츠",
        ],
        answerIndex: 1,
        explanation:
          "정형 데이터는 행과 열의 구조로 정리된 데이터입니다. 표 형태의 매출 데이터가 대표적인 예시예요.",
      },
      {
        id: "q1-2",
        topic: "분석 프로세스",
        question: "데이터 분석 프로세스의 일반적인 순서로 옳은 것은?",
        options: [
          "시각화 → 수집 → 정제 → 해석",
          "수집 → 정제 → 탐색/분석 → 시각화·해석",
          "해석 → 분석 → 수집 → 정제",
          "정제 → 시각화 → 수집 → 분석",
        ],
        answerIndex: 1,
        explanation:
          "데이터 분석은 보통 수집 → 정제 → 탐색적 분석 → 시각화와 해석의 흐름으로 진행됩니다.",
      },
      {
        id: "q1-3",
        topic: "Pandas 기초",
        question: "Pandas에서 표 형태의 데이터를 담는 핵심 자료구조는?",
        options: ["List", "DataFrame", "Tuple", "Dictionary"],
        answerIndex: 1,
        explanation:
          "DataFrame은 행과 열로 이루어진 Pandas의 핵심 자료구조로, 엑셀 표와 비슷하게 데이터를 다룰 수 있습니다.",
      },
      {
        id: "q1-4",
        topic: "결측치 처리",
        question: "결측치(missing value)에 대한 설명으로 옳은 것은?",
        options: [
          "항상 0으로 바꿔야 한다",
          "무조건 해당 행을 삭제해야 한다",
          "데이터의 맥락에 따라 삭제·대체 등 처리 방법을 선택한다",
          "분석 결과에 영향을 주지 않는다",
        ],
        answerIndex: 2,
        explanation:
          "결측치 처리에 정답은 없습니다. 데이터의 성격과 분석 목적에 따라 삭제, 평균 대체 등 적절한 방법을 골라야 해요.",
      },
      {
        id: "q1-5",
        topic: "탐색적 분석(EDA)",
        question: "탐색적 데이터 분석(EDA)의 주된 목적은?",
        options: [
          "최종 보고서를 예쁘게 꾸미기 위해",
          "데이터의 분포와 패턴, 이상치를 파악하기 위해",
          "데이터를 암호화하기 위해",
          "데이터베이스 속도를 높이기 위해",
        ],
        answerIndex: 1,
        explanation:
          "EDA는 본격적인 분석 전에 데이터의 구조, 분포, 이상치를 파악해 분석 방향을 잡는 과정입니다.",
      },
      {
        id: "q1-6",
        topic: "데이터 시각화",
        question: "매출 추이를 시간 흐름에 따라 보여줄 때 가장 적절한 차트는?",
        options: ["파이 차트", "선(라인) 차트", "산점도", "히트맵"],
        answerIndex: 1,
        explanation:
          "시간에 따른 변화(추이)를 보여줄 때는 선 차트가 가장 직관적입니다.",
      },
      {
        id: "q1-7",
        topic: "기초 통계",
        question: "평균보다 중앙값을 쓰는 것이 나은 경우는?",
        options: [
          "데이터에 극단적인 이상치가 있을 때",
          "데이터가 완벽한 정규분포일 때",
          "데이터 개수가 많을 때",
          "언제나 평균이 더 정확하다",
        ],
        answerIndex: 0,
        explanation:
          "연봉처럼 극단값이 있는 데이터에서는 평균이 왜곡되기 쉬워 중앙값이 대표값으로 더 적절합니다.",
      },
    ],
  },
  {
    id: "q2",
    courseId: "c2",
    title: "생성형 AI 활용 점검",
    description: "생성형 AI와 프롬프트 설계 원칙을 얼마나 이해했는지 확인해보세요.",
    questions: [
      {
        id: "q2-1",
        topic: "프롬프트 설계",
        question: "좋은 프롬프트의 조건으로 가장 거리가 먼 것은?",
        options: [
          "역할과 맥락을 구체적으로 지정한다",
          "원하는 출력 형식을 명시한다",
          "최대한 짧고 모호하게 작성한다",
          "예시를 함께 제공한다",
        ],
        answerIndex: 2,
        explanation:
          "모호한 프롬프트는 모호한 답을 만듭니다. 역할·맥락·형식·예시를 구체적으로 줄수록 결과 품질이 올라가요.",
      },
      {
        id: "q2-2",
        topic: "AI의 한계",
        question: "생성형 AI의 '환각(Hallucination)'이란?",
        options: [
          "AI가 스스로 학습을 멈추는 현상",
          "사실이 아닌 내용을 그럴듯하게 만들어내는 현상",
          "응답 속도가 느려지는 현상",
          "같은 답변만 반복하는 현상",
        ],
        answerIndex: 1,
        explanation:
          "환각은 AI가 존재하지 않는 사실을 자신 있게 답하는 현상입니다. 중요한 정보는 반드시 출처를 검증해야 해요.",
      },
      {
        id: "q2-3",
        topic: "업무 활용 범위",
        question: "업무에서 생성형 AI를 활용하기에 가장 적합한 일은?",
        options: [
          "회사 기밀 데이터의 외부 공유",
          "초안 작성과 아이데이션",
          "최종 의사결정의 완전한 위임",
          "법적 계약서의 무검토 제출",
        ],
        answerIndex: 1,
        explanation:
          "AI는 초안 작성, 아이디어 확장, 요약 등에서 강력합니다. 최종 판단과 검증은 사람의 몫이에요.",
      },
      {
        id: "q2-4",
        topic: "프롬프트 설계",
        question: "프롬프트에서 '역할 지정'의 예시로 알맞은 것은?",
        options: [
          "'아무거나 써줘'",
          "'너는 10년차 마케팅 전문가야. 신제품 런칭 문구를 3개 제안해줘'",
          "'빨리 답해줘'",
          "'길게 써줘'",
        ],
        answerIndex: 1,
        explanation:
          "역할을 지정하면 AI가 해당 전문가의 관점과 어휘로 답변해 결과의 완성도가 높아집니다.",
      },
      {
        id: "q2-5",
        topic: "결과물 검증",
        question: "AI가 생성한 결과물을 업무에 쓰기 전 반드시 해야 할 일은?",
        options: [
          "그대로 복사해 제출한다",
          "사실 관계와 맥락을 검토·수정한다",
          "결과가 마음에 들면 검토를 생략한다",
          "글자 수만 확인한다",
        ],
        answerIndex: 1,
        explanation:
          "AI 결과물은 항상 초안입니다. 사실 확인과 우리 상황에 맞는 수정이 필수예요.",
      },
      {
        id: "q2-6",
        topic: "출력 형식 지정",
        question: "회의록 요약을 요청할 때 가장 효과적인 프롬프트는?",
        options: [
          "'요약해줘'",
          "'회의록을 결정사항·액션아이템·담당자 형식의 표로 요약해줘'",
          "'읽어봐'",
          "'중요한 것만'",
        ],
        answerIndex: 1,
        explanation:
          "출력 형식(표, 항목 구조)을 지정하면 바로 업무에 쓸 수 있는 형태의 결과를 얻을 수 있습니다.",
      },
      {
        id: "q2-7",
        topic: "업무 자동화",
        question: "반복 업무 자동화에 프롬프트 템플릿을 쓰는 이유는?",
        options: [
          "매번 새로 고민하지 않고 일관된 품질의 결과를 얻기 위해",
          "AI 사용료를 늘리기 위해",
          "결과를 예측 불가능하게 만들기 위해",
          "템플릿은 자동화와 무관하다",
        ],
        answerIndex: 0,
        explanation:
          "검증된 프롬프트를 템플릿으로 만들어두면 반복 업무에서 시간을 아끼고 품질 편차를 줄일 수 있습니다.",
      },
    ],
  },
  {
    id: "q3",
    courseId: "c9",
    title: "SQL 핵심 개념 체크",
    description: "SQL 데이터 조회와 집계의 핵심을 점검해보세요.",
    questions: [
      {
        id: "q3-1",
        topic: "SELECT 기초",
        question: "테이블에서 데이터를 조회하는 SQL 명령어는?",
        options: ["INSERT", "SELECT", "UPDATE", "DELETE"],
        answerIndex: 1,
        explanation: "SELECT는 테이블에서 원하는 데이터를 조회하는 가장 기본적인 명령어입니다.",
      },
      {
        id: "q3-2",
        topic: "조건 필터링",
        question: "특정 조건을 만족하는 행만 조회하려면 어떤 절을 사용할까요?",
        options: ["ORDER BY", "WHERE", "GROUP BY", "LIMIT"],
        answerIndex: 1,
        explanation: "WHERE 절은 조건을 지정해 원하는 행만 걸러낼 때 사용합니다.",
      },
      {
        id: "q3-3",
        topic: "집계",
        question: "카테고리별 매출 합계를 구할 때 필요한 조합은?",
        options: [
          "GROUP BY + SUM",
          "ORDER BY + COUNT",
          "WHERE + LIMIT",
          "JOIN + DISTINCT",
        ],
        answerIndex: 0,
        explanation:
          "GROUP BY로 카테고리를 묶고 SUM 집계 함수로 그룹별 합계를 계산합니다.",
      },
      {
        id: "q3-4",
        topic: "JOIN",
        question: "두 테이블을 공통 키로 연결해 조회하는 방법은?",
        options: ["UNION", "JOIN", "HAVING", "INDEX"],
        answerIndex: 1,
        explanation:
          "JOIN은 두 테이블을 공통 컬럼(키)으로 연결해 하나의 결과로 조회하는 방법입니다.",
      },
      {
        id: "q3-5",
        topic: "정렬",
        question: "조회 결과를 매출이 큰 순서대로 정렬하려면?",
        options: [
          "ORDER BY sales ASC",
          "ORDER BY sales DESC",
          "GROUP BY sales",
          "WHERE sales DESC",
        ],
        answerIndex: 1,
        explanation: "내림차순 정렬은 ORDER BY 컬럼명 DESC를 사용합니다.",
      },
      {
        id: "q3-6",
        topic: "집계",
        question: "집계 결과에 조건을 걸 때 사용하는 절은?",
        options: ["WHERE", "HAVING", "LIMIT", "ON"],
        answerIndex: 1,
        explanation:
          "WHERE는 집계 전 개별 행에, HAVING은 GROUP BY 집계 결과에 조건을 겁니다.",
      },
      {
        id: "q3-7",
        topic: "중복 제거",
        question: "중복을 제거하고 고유한 값만 조회하는 키워드는?",
        options: ["UNIQUE ONLY", "DISTINCT", "REMOVE DUP", "SINGLE"],
        answerIndex: 1,
        explanation: "SELECT DISTINCT를 사용하면 중복이 제거된 고유한 값만 조회됩니다.",
      },
    ],
  },
];

// ---------- 과제 5개 ----------

export const ASSIGNMENTS: Assignment[] = [
  {
    id: "a1",
    courseId: "c1",
    title: "판매 데이터 요약 분석",
    description:
      "제공된 월별 판매 데이터에서 발견한 인사이트 3가지를 정리해 제출해주세요. 어떤 데이터를 근거로 했는지 함께 적으면 좋아요.",
    dueInDays: 2,
  },
  {
    id: "a2",
    courseId: "c1",
    title: "나의 데이터 분석 주제 정하기",
    description:
      "일상이나 업무에서 분석해보고 싶은 주제 1가지를 정하고, 필요한 데이터와 예상 분석 과정을 간단히 설명해주세요.",
    dueInDays: 6,
  },
  {
    id: "a3",
    courseId: "c2",
    title: "업무 프롬프트 템플릿 만들기",
    description:
      "본인의 반복 업무 1가지를 골라 재사용 가능한 프롬프트 템플릿을 작성하고, 실제 실행 결과와 함께 제출해주세요.",
    dueInDays: 4,
  },
  {
    id: "a4",
    courseId: "c3",
    title: "레퍼런스 앱 UX 분석",
    description:
      "자주 쓰는 앱 하나를 골라 좋은 UX 요소 2가지와 개선하고 싶은 요소 1가지를 분석해 제출해주세요.",
    dueInDays: 9,
  },
  {
    id: "a5",
    courseId: "c9",
    title: "분석 쿼리 작성 연습",
    description:
      "실습 데이터베이스에서 '월별 신규 가입자 수'를 구하는 쿼리를 작성하고, 쿼리의 각 부분이 하는 역할을 설명해주세요.",
    dueInDays: 1,
  },
];

// ---------- 리뷰 30개 ----------

export const REVIEWS: Review[] = [
  { id: "r1", courseId: "c1", author: "이수민", rating: 5, content: "비전공자인데도 막히는 부분 없이 따라갈 수 있었어요. 실습 데이터가 실제 업무 데이터 같아서 몰입됐습니다.", date: "2026-08-10" },
  { id: "r2", courseId: "c1", author: "박준영", rating: 5, content: "회사에서 엑셀로만 하던 일을 Python으로 자동화하게 됐어요. 강사님 설명이 정말 친절합니다.", date: "2026-07-28" },
  { id: "r3", courseId: "c1", author: "김하늘", rating: 4, content: "EDA 파트가 특히 좋았습니다. 다만 시각화 파트가 조금 더 길었으면 해요.", date: "2026-07-15" },
  { id: "r4", courseId: "c1", author: "정다은", rating: 5, content: "데이터 직무 면접 준비에 큰 도움이 됐습니다. 커리큘럼 구성이 탄탄해요.", date: "2026-06-30" },
  { id: "r5", courseId: "c2", author: "최민호", rating: 5, content: "프롬프트 5원칙 배우고 나서 AI 답변 품질이 완전히 달라졌어요. 팀원들에게도 추천했습니다.", date: "2026-08-12" },
  { id: "r6", courseId: "c2", author: "한소희", rating: 5, content: "보고서 작성 시간이 절반으로 줄었습니다. 실무 예시가 풍부해서 좋아요.", date: "2026-08-01" },
  { id: "r7", courseId: "c2", author: "임재현", rating: 4, content: "입문자에게 딱 맞는 난이도. 심화 과정도 나왔으면 좋겠어요.", date: "2026-07-20" },
  { id: "r8", courseId: "c3", author: "윤지아", rating: 5, content: "디자인을 감이 아니라 원리로 설명해주셔서 좋았어요. Figma 실습이 알찹니다.", date: "2026-08-05" },
  { id: "r9", courseId: "c3", author: "강태오", rating: 4, content: "개발자인데 디자이너와 소통이 훨씬 수월해졌습니다.", date: "2026-07-22" },
  { id: "r10", courseId: "c3", author: "서예린", rating: 5, content: "포트폴리오 첫 작업물을 이 강의로 만들었어요. 추천합니다!", date: "2026-07-08" },
  { id: "r11", courseId: "c4", author: "오동현", rating: 5, content: "피벗테이블을 10년 만에 제대로 배웠네요. 바로 업무에 적용했습니다.", date: "2026-08-03" },
  { id: "r12", courseId: "c4", author: "신유나", rating: 4, content: "대시보드 만들기 파트가 백미입니다. 함수 파트는 아는 내용이라 빠르게 넘겼어요.", date: "2026-07-18" },
  { id: "r13", courseId: "c5", author: "장민석", rating: 5, content: "화상회의에서 쓸 표현을 통째로 외웠더니 실제 미팅에서 자신감이 생겼습니다.", date: "2026-08-08" },
  { id: "r14", courseId: "c5", author: "홍세아", rating: 4, content: "이메일 파트가 특히 실용적이에요. 표현 정리 자료도 잘 되어 있습니다.", date: "2026-07-25" },
  { id: "r15", courseId: "c6", author: "문지호", rating: 4, content: "마케팅 전체 그림을 잡기에 좋은 강의. 초보 사장님들께 추천해요.", date: "2026-08-02" },
  { id: "r16", courseId: "c6", author: "배수진", rating: 5, content: "소액 광고 실습 덕분에 첫 캠페인을 겁 없이 돌려봤습니다.", date: "2026-07-12" },
  { id: "r17", courseId: "c7", author: "권도윤", rating: 5, content: "코딩이 처음인데 설명 속도가 딱 좋아요. 폴더 정리 자동화 만들었을 때 감동!", date: "2026-08-14" },
  { id: "r18", courseId: "c7", author: "노은채", rating: 5, content: "비전공자 눈높이에 맞춘 최고의 파이썬 입문 강의입니다.", date: "2026-08-06" },
  { id: "r19", courseId: "c7", author: "유상현", rating: 4, content: "기초를 탄탄하게 잡아줍니다. 다음 단계 강의로 자연스럽게 이어져요.", date: "2026-07-19" },
  { id: "r20", courseId: "c8", author: "고아라", rating: 5, content: "린 캔버스 실습하면서 사업 아이디어의 허점을 발견했어요. 창업 전 필수 강의.", date: "2026-08-09" },
  { id: "r21", courseId: "c8", author: "심규혁", rating: 4, content: "IR 스토리 파트가 실전적입니다. 실제 투자 유치 사례가 인상적이었어요.", date: "2026-07-27" },
  { id: "r22", courseId: "c9", author: "안세영", rating: 5, content: "데이터팀에 요청 안 하고 직접 쿼리 짜서 뽑을 수 있게 됐습니다. 업무 효율 수직 상승!", date: "2026-08-11" },
  { id: "r23", courseId: "c9", author: "조현우", rating: 5, content: "JOIN이 이렇게 쉽게 이해될 줄 몰랐어요. 실전 쿼리 패턴 파트 강추.", date: "2026-08-04" },
  { id: "r24", courseId: "c9", author: "표민서", rating: 4, content: "리텐션 분석 쿼리를 실무에 바로 썼습니다. 예제가 현실적이에요.", date: "2026-07-21" },
  { id: "r25", courseId: "c10", author: "하지원", rating: 4, content: "발표 공포증이 있었는데 구조부터 잡으니 훨씬 나아졌어요.", date: "2026-08-07" },
  { id: "r26", courseId: "c11", author: "남기태", rating: 5, content: "주간 보고서 자동화 레시피 그대로 따라 했더니 매주 2시간이 생겼습니다.", date: "2026-08-13" },
  { id: "r27", courseId: "c11", author: "송채원", rating: 4, content: "노코드 연동 파트가 신세계였어요. 자동화의 한계도 짚어줘서 균형 잡힌 강의입니다.", date: "2026-07-30" },
  { id: "r28", courseId: "c13", author: "백승호", rating: 5, content: "컴포넌트 사고방식을 제대로 배웠습니다. 투두앱 만들면서 실력이 확 늘었어요.", date: "2026-08-10" },
  { id: "r29", courseId: "c14", author: "허윤슬", rating: 5, content: "팀에 디자인 시스템을 도입하는 데 이 강의가 교과서가 됐습니다.", date: "2026-08-01" },
  { id: "r30", courseId: "c16", author: "구본준", rating: 4, content: "숫자 울렁증이 있었는데 사례 중심이라 재밌게 들었습니다. 재무비율 파트 유용해요.", date: "2026-07-26" },
];

// ---------- 헬퍼 ----------

export function getCourse(id: string): Course | undefined {
  return COURSES.find((c) => c.id === id);
}

export function getInstructor(id: string): Instructor | undefined {
  return INSTRUCTORS.find((i) => i.id === id);
}

export function getCategory(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function courseLessons(course: Course): Lesson[] {
  return course.sections.flatMap((s) => s.lessons);
}

export function getLesson(lessonId: string): { course: Course; lesson: Lesson } | undefined {
  for (const course of COURSES) {
    for (const section of course.sections) {
      const lesson = section.lessons.find((l) => l.id === lessonId);
      if (lesson) return { course, lesson };
    }
  }
  return undefined;
}

export function courseReviews(courseId: string): Review[] {
  return REVIEWS.filter((r) => r.courseId === courseId);
}

export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

export function formatPrice(price: number): string {
  if (price === 0) return "무료";
  return `₩${price.toLocaleString("ko-KR")}`;
}

// 썸네일 그라디언트 톤 (딥 포레스트 그린 계열 - 추후 실제 이미지로 교체)
export const THUMBNAIL_TONES = [
  "from-forest-900 via-forest-800 to-forest-600",
  "from-forest-950 via-forest-800 to-gold-600/70",
  "from-forest-800 via-forest-700 to-forest-400",
  "from-forest-900 via-forest-700 to-cream-500/60",
  "from-forest-950 via-forest-900 to-forest-500",
  "from-forest-800 via-forest-600 to-gold-500/60",
];
