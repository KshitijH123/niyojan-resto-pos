"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/store";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";

export default function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthed = useAuth((s) => s.isAuthed);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthed) {
      router.push("/login");
    }
  }, [isAuthed, router]);

  if (!isAuthed) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 no-print">
            <SidebarTrigger className="md:hidden" />
            <div className="w-full flex-1">
              <h1 className="text-lg font-semibold md:text-xl">Niyojan Resto</h1>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-2 md:p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
