"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { MOBILE_NAV, isNavActive } from "@/lib/nav";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="하단 메뉴"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-forest-800 bg-forest-950/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {MOBILE_NAV.map((item) => {
          const active = isNavActive(pathname, item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "flex min-h-[64px] flex-1 flex-col items-center justify-center gap-1 rounded-lg text-xs font-medium transition-colors",
                active ? "text-cream-50" : "text-cream-200/55"
              )}
            >
              <span
                className={clsx(
                  "flex h-8 w-12 items-center justify-center rounded-full transition-colors",
                  active && "bg-forest-700/80"
                )}
              >
                <Icon size={19} />
              </span>
              {item.short}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
