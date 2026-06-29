"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { parseMidiMessage } from "@/utils/MidiParser";

const ctx =
  typeof window !== "undefined"
    ? new AudioContext({ latencyHint: "interactive" })
    : null;

export interface AudioContextInterface {
  audioContext: AudioContext;
  midiInstance: MIDIAccess | null;
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
  const [midiInstance, setMidiInstance] = useState<MIDIAccess | null>(null);
  useEffect(() => {
    if (typeof navigator !== "undefined" && "requestMIDIAccess" in navigator) {
      navigator.requestMIDIAccess().then((midi) => {
        setMidiInstance(midi);
      });
    }
  }, []);
  return (
    <AudioContextContext.Provider
      value={{
        // @ts-ignore:next-line
        audioContext: ctx,
        midiInstance: midiInstance,
      }}
    >
      {children}
    </AudioContextContext.Provider>
  );
}

export function useAudioContext() {
  return useContext(AudioContextContext);
}
