import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="font-display text-6xl font-semibold text-forest-300">404</p>
      <h1 className="mt-4 font-display text-xl font-semibold text-forest-950">
        페이지를 찾을 수 없어요
      </h1>
      <p className="mt-2 text-sm text-forest-950/55">
        주소가 바뀌었거나 삭제된 페이지예요.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
        <Link
          href="/"
          className="btn-press inline-flex min-h-[48px] items-center rounded-full bg-forest-900 px-6 text-sm font-bold text-cream-50"
        >
          홈으로 가기
        </Link>
        <Link
          href="/courses"
          className="btn-press inline-flex min-h-[48px] items-center rounded-full border border-cream-300 bg-white px-6 text-sm font-semibold text-forest-950/75"
        >
          강의 찾기
        </Link>
      </div>
    </div>
  );
}
