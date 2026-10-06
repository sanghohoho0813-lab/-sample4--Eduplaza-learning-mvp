import type { Metadata } from "next";
import { getCourse, getInstructor } from "@/lib/data";

// 강의 상세는 강의명·소개로 탭 제목과 공유 미리보기를 만든다
export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const course = getCourse(params.id);
  if (!course) return { title: "강의를 찾을 수 없어요" };
  const instructor = getInstructor(course.instructorId)?.name;
  return {
    title: course.title,
    description: course.subtitle,
    openGraph: {
      title: course.title,
      description: `${course.subtitle}${instructor ? ` · ${instructor} 강사` : ""}`,
      images: [{ url: `/images/courses/${course.id}.jpg`, width: 1280, height: 720 }],
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
