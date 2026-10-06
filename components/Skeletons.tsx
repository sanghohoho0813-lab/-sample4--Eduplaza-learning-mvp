export function CourseCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-video rounded-none" />
      <div className="space-y-2.5 p-4">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-3 w-2/3" />
      </div>
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton h-7 w-56" />
          <div className="skeleton h-4 w-40" />
        </div>
        <div className="flex gap-2">
          <div className="skeleton h-11 w-11 rounded-full" />
          <div className="skeleton h-11 w-11 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-28" />
        ))}
      </div>
      <div className="skeleton h-56" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-20" />
      ))}
    </div>
  );
}

export function PlayerSkeleton() {
  return (
    <div className="space-y-4">
      <div className="skeleton aspect-video w-full rounded-2xl" />
      <div className="skeleton h-6 w-2/3" />
      <div className="skeleton h-4 w-40" />
      <div className="skeleton h-40" />
    </div>
  );
}

/** 강의 목록 화면 로딩 — 모바일은 목록형 행, 태블릿 이상은 카드 그리드 모양 그대로 */
export function CourseListSkeleton({ title }: { title: string }) {
  return (
    <div aria-busy="true" aria-label={`${title} 불러오는 중`}>
      <div className="skeleton mb-6 h-9 w-40" />
      <ul className="space-y-3 sm:hidden">
        {[0, 1, 2, 3].map((i) => (
          <li key={i} className="card flex items-center gap-3 p-3">
            <div className="skeleton aspect-video w-28 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3 w-20" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-3 w-2/3" />
            </div>
          </li>
        ))}
      </ul>
      <div className="hidden grid-cols-2 gap-4 sm:grid xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
