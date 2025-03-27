"use client";
import { Toaster } from "@/components/ui/sonner";

import { redirect, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { AudioProvider } from "@/components/AudioProvider";
import Stack from "@/components/Stack";

export default function Home() {
  const searchParams = useSearchParams();
  const acc = searchParams.get("acc");
  useEffect(() => {
    if (acc) {
      sessionStorage.setItem("access_token", acc);
      redirect(process.env.NEXT_PUBLIC_AUTH_REDIRECT!);
    }
  }, [acc]);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <AudioProvider>
          <Stack />
        </AudioProvider>
      </main>
      <Toaster />
    </div>
  );
}
