"use client";

import { useEffect, useState } from "react";
import { useAudioContext } from "@/components/AudioProvider";
import { Slider } from "@/components/ui/slider";
import { Label } from "./ui/label";

export default function BasicWorklet({ index }: { index: number }) {
  const { audioContext: ctx, addNode, removeNode, nodes } = useAudioContext();
  const [workletNode, setWorkletNode] = useState<AudioWorkletNode | undefined>(
    undefined
  );

  useEffect(() => {
    // Load the AudioWorklet
    async function loadAudioWorklet() {
      await ctx.audioWorklet.addModule("random-noise-processor.js");
      const newNode = new AudioWorkletNode(ctx, "random-noise-processor");
      setWorkletNode(newNode);
      addNode(newNode, index);
    }

    loadAudioWorklet();

    return () => {
      removeNode(workletNode);
    };
  }, [index]);

  return (
    <div className="w-full flex flex-col items-stretch gap-5 border-1 p-6 rounded-3xl shadow-xl">
      <Label>Noise</Label>
      <Slider
        min={0}
        max={1}
        defaultValue={[0]}
        step={0.001}
        onValueChange={(e) => {
          workletNode?.parameters.get("volume")?.setValueAtTime(e[0], 0);
        }}
      />
    </div>
  );
}
