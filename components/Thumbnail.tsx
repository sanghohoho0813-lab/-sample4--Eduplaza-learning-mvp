import clsx from "clsx";
import { GraduationCap } from "lucide-react";
import { THUMBNAIL_TONES } from "@/lib/data";

// 16:9 강의 썸네일 슬롯.
// 추후 /public/images/courses/{courseId}.jpg 를 넣고 <img>로 교체하면 된다.
export function CourseThumbnail({
  tone,
  title,
  className,
  rounded = "rounded-xl",
}: {
  tone: number;
  title: string;
  className?: string;
  rounded?: string;
}) {
  return (
    <div
      className={clsx(
        "relative aspect-video w-full overflow-hidden bg-gradient-to-br",
        THUMBNAIL_TONES[tone % THUMBNAIL_TONES.length],
        rounded,
        className
      )}
      aria-label={`${title} 썸네일`}
    >
      {/* 조명 느낌의 소프트 하이라이트 */}
      <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-cream-50/10 blur-2xl" />
      <div className="absolute -bottom-12 -left-6 h-28 w-28 rounded-full bg-gold-300/10 blur-2xl" />
      <div className="absolute inset-0 flex items-center justify-center">
        <GraduationCap className="text-cream-50/25" size={34} />
      </div>
    </div>
  );
}

// 1:1 강사 프로필 슬롯. 추후 /public/images/instructors/{id}.jpg 로 교체.
export function InstructorAvatar({
  name,
  size = "h-12 w-12",
  className,
}: {
  name: string;
  size?: string;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex aspect-square items-center justify-center rounded-full bg-gradient-to-br from-forest-500 to-forest-800 font-display font-semibold text-cream-50",
        size,
        className
      )}
      aria-label={`${name} 프로필`}
    >
      {name.charAt(0)}
    </div>
  );
}
