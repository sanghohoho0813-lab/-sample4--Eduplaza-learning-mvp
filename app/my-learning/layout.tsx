import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "내 학습", template: "%s | EduPlaza by 미래에이아이랩" },
  description: "수강 중인 강의와 진도, 남은 과제를 한곳에서 확인하세요.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
