/** 홈 로딩 — 실제 배치(이어서 학습 · 오늘 할 일 · 이번 주)와 같은 자리에 */
export function HomeSkeleton() {
  return (
    <div aria-busy="true" aria-label="홈 불러오는 중">
      <div className="mb-6 space-y-2">
        <div className="skeleton h-8 w-64" />
        <div className="skeleton h-4 w-48" />
      </div>
      <div className="skeleton mb-7 h-10 w-full" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr),340px]">
        <div className="space-y-9">
          <div className="skeleton h-72 rounded-3xl" />
          <div className="space-y-3">
            <div className="skeleton h-6 w-40" />
            <div className="skeleton h-24" />
            <div className="skeleton h-24" />
          </div>
        </div>
        <div className="space-y-9">
          <div className="space-y-3">
            <div className="skeleton h-6 w-28" />
            <div className="skeleton h-56" />
          </div>
          <div className="skeleton h-44" />
        </div>
      </div>
    </div>
  );
}

/** 강의 찾기 로딩 — 검색칸 · 분야 아이콘 · 큐레이션 줄 */
export function ExploreSkeleton() {
  return (
    <div aria-busy="true" aria-label="강의 찾기 불러오는 중">
      <div className="skeleton mb-6 h-9 w-40" />
      <div className="skeleton mb-6 h-14 w-full rounded-2xl sm:hidden" />
      <div className="mb-9 grid grid-cols-4 gap-x-2 gap-y-4 lg:grid-cols-8 lg:gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="skeleton h-14 w-14 rounded-2xl" />
            <div className="skeleton h-3 w-10" />
          </div>
        ))}
      </div>
      <div className="skeleton mb-4 h-6 w-48" />
      <div className="flex gap-4 overflow-hidden">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="w-[72%] shrink-0 space-y-3 sm:w-[42%] xl:w-[23%]">
            <div className="skeleton aspect-video rounded-2xl" />
            <div className="skeleton h-4 w-4/5" />
            <div className="skeleton h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** 내 학습 로딩 — 이어서 학습 · 탭 · 강의 줄 */
export function LibrarySkeleton() {
  return (
    <div aria-busy="true" aria-label="내 학습 불러오는 중">
      <div className="mb-6 space-y-2">
        <div className="skeleton h-9 w-32" />
        <div className="skeleton h-4 w-56" />
      </div>
      <div className="skeleton mb-6 h-32 rounded-2xl" />
      <div className="skeleton mb-5 h-12 w-72 rounded-full" />
      <ul className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <li key={i} className="card flex gap-4 p-4 sm:p-5">
            <div className="skeleton aspect-video w-28 shrink-0 sm:w-40" />
            <div className="flex-1 space-y-2.5">
              <div className="skeleton h-3 w-24" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-2 w-3/4" />
              <div className="skeleton h-6 w-1/2 rounded-full" />
            </div>
          </li>
        ))}
      </ul>
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
