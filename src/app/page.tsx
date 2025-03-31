"use client";

import { useEffect, Suspense } from "react";
import { redirect, useSearchParams } from "next/navigation";

import { Toaster } from "@/components/ui/sonner";

import AudioProvider from "@/components/AudioProvider";
import Stack from "@/components/Stack";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";

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
        <div className="flex flex-row justify-between w-full">
          <h1 className="font-bold text-2xl mb-4">
            <b>MLA Labs'</b>{" "}
            <u className="underline-offset-8 decoration-2">no-nonsense</u> audio
            playground
          </h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" className="rounded-full">
                <Info />
              </Button>
            </DialogTrigger>
            <DialogContent className="">
              <DialogHeader>
                <DialogTitle>The Playground</DialogTitle>
                <DialogDescription>
                  🎛 Just a few tips to get you started 🎶
                </DialogDescription>
              </DialogHeader>
              <div className="text-sm flex flex-col gap-4">
                <p>
                  {
                    "Choose any input device—your microphone, a synth, or even a noisy fan—and run it through the playground’s effects. Or, if you’re feeling adventurous, upload any file (yes, even an image or text file!) in the File tab and explore how it sounds when looped, detuned, or warped with different playback rates."
                  }
                </p>
                <p>
                  {
                    "Need inspiration? Log in with FreeSound and dive into their massive collection of samples—you might stumble upon the perfect starting point!"
                  }
                </p>
                <p>
                  {
                    "With a variety of effects at your fingertips, tweak, twist, and shape the sound in real-time. Once you’ve crafted something unique, try recording it! You can then download your creation or reintroduce it as an input to push your experiment even further."
                  }
                </p>
                <p>
                  {
                    "No rules, just sonic exploration—let’s see what you can create! 🚀🔊"
                  }
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <AudioProvider>
          <Stack />
        </AudioProvider>
        <footer className="flex flex-col items-center justify-between w-full mt-32">
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
