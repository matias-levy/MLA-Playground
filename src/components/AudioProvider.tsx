"use client";

import { createContext, useContext } from "react";

const ctx =
  typeof window !== "undefined"
    ? new AudioContext({ latencyHint: "interactive" })
    : null;

export interface AudioContextInterface {
  audioContext: AudioContext;
}

export interface AudioModule {
  input: AudioNode;
  output: AudioNode;
}

// @ts-ignore:next-line
const AudioContextContext = createContext<AudioContextInterface>(null);

export default function AudioProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AudioContextContext.Provider
      value={{
        // @ts-ignore:next-line
        audioContext: ctx,
      }}
    >
      {children}
    </AudioContextContext.Provider>
  );
}

export function useAudioContext() {
  return useContext(AudioContextContext);
}
