"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/store";

export default function RootPage() {
  const router = useRouter();
  const isAuthed = useAuth((s) => s.isAuthed);

  useEffect(() => {
    if (isAuthed) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [isAuthed, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}
