"use client";

import { useEffect, Suspense } from "react";
import { redirect, useSearchParams } from "next/navigation";

import { Toaster } from "@/components/ui/sonner";

import AudioProvider from "@/components/AudioProvider";
import { MidiMapProvider } from "@/lib/useMidiMap";
import Stack from "@/components/Stack";
import { Button } from "@/components/ui/button";

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
    <div className="flex flex-col items-center min-h-screen p-8 pb-20 sm:p-20 font-(family-name:--font-geist-sans) bg-background text-foreground transition-colors duration-300">
      <main className="container mx-auto flex flex-col items-start w-full max-w-4xl">
        <AudioProvider>
          <MidiMapProvider>
            <Stack />
          </MidiMapProvider>
        </AudioProvider>
        <footer className="flex flex-col items-center justify-between w-full mt-32 text-center">
          <p className="mb-3">
            This Playground is a free and{" "}
            <a
              target="_blank"
              href="https://github.com/matias-levy/MLA-Playground"
              className="text-blue-600 hover:text-blue-500 transition-all"
            >
              open source
            </a>{" "}
            project but if you like it and found it useful consider donating to
            it's creator!
          </p>
          <Button asChild className="bg-blue-600 hover:bg-blue-500">
            <a target="_blank" href="https://paypal.me/mlalabs">
              Donate via Paypal
            </a>
          </Button>
        </footer>
      </main>
      <Toaster />
      <Suspense>
        <FreeSoundAuthParams />
      </Suspense>
    </div>
  );
}
