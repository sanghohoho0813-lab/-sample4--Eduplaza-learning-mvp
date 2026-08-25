"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { BookOpen, Compass, Home, PenSquare, User } from "lucide-react";

const NAV = [
  { href: "/", label: "홈", icon: Home },
  { href: "/courses", label: "강의", icon: Compass },
  { href: "/my-learning", label: "학습", icon: BookOpen },
  { href: "/quiz", label: "퀴즈", icon: PenSquare },
  { href: "/my", label: "마이", icon: User },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-forest-800 bg-forest-950/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg text-[11px] font-medium transition-colors",
                active ? "text-cream-50" : "text-cream-200/50"
              )}
            >
              <span
                className={clsx(
                  "flex h-7 w-11 items-center justify-center rounded-full transition-colors",
                  active && "bg-forest-700/80"
                )}
              >
                <Icon size={19} />
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
