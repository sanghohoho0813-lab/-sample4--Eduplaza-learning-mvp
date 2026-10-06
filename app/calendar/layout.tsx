import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "학습 캘린더", template: "%s | EduPlaza by 미래에이아이랩" },
  description: "날짜별 학습 기록과 다가오는 과제 마감을 확인하세요.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
