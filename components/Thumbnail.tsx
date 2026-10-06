"use client";

import { useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import { GraduationCap } from "lucide-react";
import { THUMBNAIL_TONES } from "@/lib/data";

// 16:9 강의 썸네일. public/images/courses/{courseId}.jpg 를 next/image로 내려
// 화면 폭에 맞는 크기·형식(AVIF/WebP)으로 받는다. 파일이 없거나 로딩에 실패하면
// 그라디언트 플레이스홀더로 대체한다.
export function CourseThumbnail({
  tone,
  title,
  courseId,
  className,
  rounded = "rounded-xl",
  priority = false,
  sizes = "(min-width: 1024px) 360px, 100vw",
}: {
  tone: number;
  title: string;
  courseId?: string;
  className?: string;
  rounded?: string;
  priority?: boolean;
  /** 실제로 그려지는 폭 — 브라우저가 알맞은 해상도만 내려받게 한다 */
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(courseId) && !failed;

  return (
    <div
      className={clsx(
        "relative aspect-video w-full overflow-hidden bg-gradient-to-br",
        THUMBNAIL_TONES[tone % THUMBNAIL_TONES.length],
        rounded,
        className
      )}
    >
      {showImage ? (
        <Image
          src={`/images/courses/${courseId}.jpg`}
          alt={`${title} 강의 썸네일`}
          fill
          sizes={sizes}
          priority={priority}
          onError={() => setFailed(true)}
          className="object-cover"
        />
      ) : (
        <>
          <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-cream-50/10 blur-2xl" />
          <div className="absolute -bottom-12 -left-6 h-28 w-28 rounded-full bg-gold-300/10 blur-2xl" />
          <div className="absolute inset-0 flex items-center justify-center">
            <GraduationCap className="text-cream-50/25" size={44} />
          </div>
        </>
      )}
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
