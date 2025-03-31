"use client";

import { useEffect, Suspense } from "react";
import { redirect, useSearchParams } from "next/navigation";

import { Toaster } from "@/components/ui/sonner";

import AudioProvider from "@/components/AudioProvider";
import Stack from "@/components/Stack";

function FreeSoundAuthParams() {
  const searchParams = useSearchParams();
  const acc = searchParams.get("acc");
  useEffect(() => {
    if (acc) {
      sessionStorage.setItem("access_token", acc);
      redirect(process.env.NEXT_PUBLIC_AUTH_REDIRECT!);
    }
  }, [acc]);
  return <></>;
}

export default function Home() {
  return (
    <div className="flex flex-col items-center min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="container mx-auto flex flex-col items-start w-full max-w-4xl">
        <h1 className="font-bold text-2xl mb-4">
          <b>MLA Labs'</b>{" "}
          <u className="underline-offset-8 decoration-2">no-nonsense</u> audio
          playground
        </h1>
        <AudioProvider>
          <Stack />
        </AudioProvider>
      </main>
      <Toaster />
      <Suspense>
        <FreeSoundAuthParams />
      </Suspense>
    </div>
  );
}
