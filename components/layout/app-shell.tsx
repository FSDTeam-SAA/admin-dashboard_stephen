"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Menu } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#020202] text-white">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[300px_1fr]">
        <div className="hidden border-r border-white/10 lg:block">
          <Sidebar />
        </div>

        <div className="flex flex-col">
          <header className="flex h-20 items-center justify-between border-b border-white/40 px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <button className="rounded-md border border-white/30 p-2 lg:hidden" onClick={() => setOpen(true)}>
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="text-title-24 text-white">Dashboard</h1>
            </div>
            <div className="text-body-16 flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-[#1f2930] font-bold">
              {getInitials(data?.user?.name)}
            </div>
          </header>

          <main className="flex-1 p-5 lg:p-8">{children}</main>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72">
            <Sidebar mobile onNav={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

