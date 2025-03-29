"use client";

import { createContext, useContext } from "react";

const ctx =
  typeof window !== "undefined"
    ? new AudioContext({ latencyHint: "interactive" })
    : null;

export interface AudioContextInterface {
  audioContext: AudioContext;
  nodes: AudioNode[];
  setInput: Function;
  setOutput: Function;
  addNode: Function;
  removeNode: Function;
}

export interface AudioModule {
  input: AudioNode;
  output: AudioNode;
}

const AudioContextContext = createContext<AudioContextInterface | null>(null);

export default function AudioProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AudioContextContext.Provider
      value={{
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
