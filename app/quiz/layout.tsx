import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "퀴즈·과제", template: "%s | EduPlaza by 미래에이아이랩" },
  description: "배운 내용을 퀴즈로 점검하고 틀린 문제만 골라 다시 풀어보세요.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
