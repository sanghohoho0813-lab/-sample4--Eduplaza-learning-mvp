import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "학습 리포트", template: "%s | EduPlaza by 미래에이아이랩" },
  description: "최근 7일 학습 시간, 강의별 진도, 취약 영역과 성취를 한눈에 보세요.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
