import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "마이페이지", template: "%s | EduPlaza by 미래에이아이랩" },
  description: "관심분야와 알림 설정, 결제 내역을 관리하세요.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
