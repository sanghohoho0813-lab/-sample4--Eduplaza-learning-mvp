import type { Metadata } from "next";
import { QUIZZES } from "@/lib/data";

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const quiz = QUIZZES.find((q) => q.id === params.id);
  return { title: quiz ? `퀴즈 · ${quiz.title}` : "퀴즈를 찾을 수 없어요" };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
