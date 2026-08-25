"use client";

import { StoreProvider } from "@/lib/store";
import { ToastProvider } from "./Toast";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <ToastProvider>
        <Sidebar />
        <main className="min-h-screen pb-24 lg:pb-10 lg:pl-60">
          <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 md:pt-8 lg:px-8">
            {children}
          </div>
        </main>
        <MobileNav />
      </ToastProvider>
    </StoreProvider>
  );
}
