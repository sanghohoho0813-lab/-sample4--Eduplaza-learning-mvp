import type { Metadata } from "next";
import { getCourse } from "@/lib/data";

export function generateMetadata({ params }: { params: { courseId: string } }): Metadata {
  const course = getCourse(params.courseId);
  return { title: course ? `학습 중 · ${course.title}` : "강의를 찾을 수 없어요", robots: { index: false } };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
