import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "강의 찾기", template: "%s | EduPlaza by 미래에이아이랩" },
  description: "데이터·AI·디자인·개발 등 18개 강의를 검색하고 카테고리·난이도·가격으로 골라보세요.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
