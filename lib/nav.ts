import {
  BarChart3,
  BookOpen,
  Compass,
  Home,
  PenSquare,
  User,
  type LucideIcon,
} from "lucide-react";

// 1차 메뉴는 학생의 실제 목적 기준으로 6개만 둔다.
// 퀴즈·과제·노트·캘린더는 "학습 활동" 한 곳으로 묶되, 라우트는 그대로 유지한다.
export interface NavItem {
  href: string;
  label: string;
  short: string; // 모바일 하단 탭용
  icon: LucideIcon;
  match: string[]; // 활성 판정에 쓰는 경로 접두사
  children?: { href: string; label: string }[];
}

export const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "홈", short: "홈", icon: Home, match: ["/"] },
  { href: "/courses", label: "강의 찾기", short: "강의", icon: Compass, match: ["/courses"] },
  {
    href: "/my-learning",
    label: "내 학습",
    short: "내 학습",
    icon: BookOpen,
    match: ["/my-learning", "/learn"],
  },
  {
    href: "/quiz",
    label: "학습 활동",
    short: "활동",
    icon: PenSquare,
    match: ["/quiz", "/notes", "/calendar"],
    children: [
      { href: "/quiz", label: "퀴즈·과제" },
      { href: "/notes", label: "학습노트" },
      { href: "/calendar", label: "학습 캘린더" },
    ],
  },
  { href: "/report", label: "리포트", short: "리포트", icon: BarChart3, match: ["/report"] },
  { href: "/my", label: "마이", short: "마이", icon: User, match: ["/my"] },
];

// 모바일 하단 탭은 5칸. 마이는 모든 화면 헤더의 프로필 버튼으로 들어간다.
export const MOBILE_NAV = PRIMARY_NAV.filter((n) => n.href !== "/my");

export function matchPath(pathname: string, prefix: string): boolean {
  if (prefix === "/") return pathname === "/";
  return pathname === prefix || pathname.startsWith(prefix + "/");
}

export function isNavActive(pathname: string, item: NavItem): boolean {
  return item.match.some((p) => matchPath(pathname, p));
}
