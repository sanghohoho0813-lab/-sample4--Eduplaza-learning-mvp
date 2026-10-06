import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "학습노트", template: "%s | EduPlaza by 미래에이아이랩" },
  description: "강의·레슨별로 남긴 학습노트를 모아 보고 편집하세요.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
