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
      <Link
        href="/"
        className="btn-press mt-6 rounded-full bg-forest-900 px-6 py-3 text-sm font-bold text-cream-50"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
